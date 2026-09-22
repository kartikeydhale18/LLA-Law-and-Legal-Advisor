from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from services.firebase import verify_token
from services.llm import extract_text_from_image, get_embedding
from services.pinecone_service import store_embeddings
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
    token = authorization.split(" ")[1]
    try:
        decoded_token = verify_token(token)
        return decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def chunk_text(text: str, chunk_size: int = 1000):
    """
    Very basic text chunker.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    try:
        # Validate file size (e.g. limit to 5MB)
        # Note: FastAPI UploadFile doesn't have size attr before reading, 
        # so we read and check length.
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

        # 1. Extract text using Gemini Vision OCR
        extracted_text = extract_text_from_image(content, file.content_type)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from document.")

        # 2. Chunk text
        chunks = chunk_text(extracted_text, chunk_size=200) # words per chunk
        
        # 3. Generate embeddings and prepare vectors for Pinecone
        vectors = []
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            vector_id = f"{file.filename}_chunk_{i}_{uuid.uuid4().hex[:8]}"
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": {"text": chunk, "source": file.filename}
            })
            
        # 4. Store in Pinecone under user's namespace
        if vectors:
            store_embeddings(vectors, namespace=user_id)
            
        return {"message": "Document processed and stored successfully.", "chunks_processed": len(chunks)}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Upload endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
