import os
import logging
import google.generativeai as genai
from groq import Groq

logger = logging.getLogger(__name__)

groq_client = None

def initialize_llms():
    global groq_client
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            logger.info("Gemini initialized.")
        else:
            logger.warning("GEMINI_API_KEY not found.")

        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            groq_client = Groq(api_key=groq_api_key)
            logger.info("Groq initialized.")
        else:
            logger.warning("GROQ_API_KEY not found.")
            
    except Exception as e:
        logger.error(f"Failed to initialize LLMs: {e}")

def get_embedding(text: str):
    """
    Generates embedding for a given text using Gemini.
    """
    try:
        result = genai.embed_content(
            model="models/gemini-embedding-2",
            content=text,
            output_dimensionality=768
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise

def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """
    Uses Gemini's vision capability to extract text from an uploaded document (image/pdf).
    """
    import time
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            model = genai.GenerativeModel('gemini-3.6-flash')
            
            prompt = "Extract all the text from this document accurately. Preserve the formatting where possible. If it's a contract or legal document, ensure all clauses are clearly separated."
            
            response = model.generate_content([
                {'mime_type': mime_type, 'data': image_bytes},
                prompt
            ])
            
            return response.text
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                logger.warning(f"Rate limit hit, retrying in 15 seconds... (Attempt {attempt + 1})")
                time.sleep(15)
            else:
                logger.error(f"Failed to extract text using Gemini Vision: {e}")
                raise e
    except Exception as e:
        logger.error(f"Failed to extract text using Gemini Vision: {e}")
        raise

def generate_answer(prompt: str, context: str = "", model_choice: str = "groq"):
    """
    Generates an answer using the chosen model.
    Includes the fairness rule enforcement in the system prompt.
    """
    system_prompt = (
        "You are LLA, an expert legal advisor for Indian Law. "
        "Your task is to explain legal documents and laws in simple, plain language. "
        "CRITICAL RULES:\n"
        "1. Fair Use: You must not enable illegal action. Your advice must be fair to ALL parties involved in a contract or dispute. "
        "If a user asks how to exploit a loophole, hide an unfair clause, or mislead another party, you MUST refuse and redirect them to a fair resolution.\n"
        "2. Grounding: If context is provided below, base your answer ONLY on that context. "
        "If you cannot answer based on the context, explicitly state your low confidence and do not hallucinate legal facts.\n"
        "3. Always cite the specific act/section you are relying on.\n"
        "4. Disclaimer: Conclude by reminding the user you are an AI and they should consult a licensed advocate for high-risk matters."
    )
    
    full_prompt = f"Context: {context}\n\nUser Question: {prompt}" if context else f"User Question: {prompt}"

    try:
        if model_choice == "groq" and groq_client:
            completion = groq_client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.1,
                max_tokens=1024
            )
            return completion.choices[0].message.content
        else:
            # Fallback to Gemini
            gemini_model = genai.GenerativeModel('gemini-3.6-flash', system_instruction=system_prompt)
            
            import time
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = gemini_model.generate_content(full_prompt)
                    return response.text
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        logger.warning(f"Rate limit hit in chat fallback, retrying in 15s... (Attempt {attempt + 1})")
                        time.sleep(15)
                    else:
                        raise e
    except Exception as e:
        logger.error(f"Failed to generate answer: {e}")
        raise
