from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.llm import generate_answer, get_embedding
from services.pinecone_service import query_embeddings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    namespace: str = "legal_corpus" # Defaults to general corpus
    use_rag: bool = True

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        context = ""
        if request.use_rag:
            # Generate embedding for the query
            query_embedding = get_embedding(request.query)
            
            # Query Pinecone
            search_results = query_embeddings(query_embedding, namespace=request.namespace)
            
            # Extract text from matches
            if search_results and "matches" in search_results:
                context_chunks = [match.metadata.get("text", "") for match in search_results.matches]
                context = "\n---\n".join(context_chunks)
        
        # Generate answer
        answer = generate_answer(prompt=request.query, context=context)
        
        return ChatResponse(answer=answer)

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
