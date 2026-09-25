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
            
            try:
                return response.text
            except ValueError:
                # Fallback if response.text fails due to safety or multiple parts
                text_parts = []
                for candidate in response.candidates:
                    for part in candidate.content.parts:
                        if hasattr(part, 'text'):
                            text_parts.append(part.text)
                if text_parts:
                    return " ".join(text_parts)
                return "Error: Document text extraction blocked by Gemini safety filters or returned complex parts."
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                logger.warning(f"Rate limit hit, retrying in 15 seconds... (Attempt {attempt + 1})")
                time.sleep(15)
            else:
                logger.error(f"Failed to extract text using Gemini Vision: {e}")
                raise e

def generate_answer(prompt: str, context: str = "", model_choice: str = "groq"):
    """
    Generates an answer using the chosen model.
    Includes the fairness rule enforcement in the system prompt.
    """
    system_prompt = (
        "You are LLA, an expert legal advisor for Indian Law. "
        "Your task is to explain legal documents and laws in simple, plain language. "
        "CRITICAL RULES:\n"
        "1. If the user provides a contract or legal scenario to review, you MUST start your response with a clear, bolded verdict: **FAIR**, **UNFAIR**, or **NEEDS REVIEW**, followed by a Fairness Score out of 10. (Skip this if the user is just saying hello or asking a general question).\n"
        "2. Fair Use: You must not enable illegal action. Your advice must be fair to ALL parties involved in a contract or dispute.\n"
        "3. Grounding: If context is provided below, base your answer ONLY on that context. If you cannot answer based on the context, state your low confidence.\n"
        "4. Always cite the specific act/section you are relying on (Skip for greetings).\n"
        "5. Disclaimer: Conclude by reminding the user you are an AI (Skip for greetings).\n"
        "6. Concise Output: You MUST be extremely concise and restrict your output to fit within a strict 1024 token limit."
    )
    
    full_prompt = f"Context: {context}\n\nUser Question: {prompt}" if context else f"User Question: {prompt}"

    try:
        if model_choice == "groq" and groq_client:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
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
            gemini_model = genai.GenerativeModel(
                'gemini-3.6-flash', 
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(max_output_tokens=1024)
            )
            
            import time
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = gemini_model.generate_content(full_prompt)
                    return response.text
                except Exception as e:
                    if "429" in str(e) and attempt < max_retries - 1:
                        logger.warning(f"Rate limit hit in chat fallback, retrying in 5s... (Attempt {attempt + 1})")
                        time.sleep(5)
                    else:
                        raise e
    except Exception as e:
        logger.error(f"Failed to generate answer: {e}")
        raise
