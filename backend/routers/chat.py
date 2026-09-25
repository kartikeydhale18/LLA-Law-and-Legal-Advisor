from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.llm import generate_answer, get_embedding
from services.pinecone_service import query_embeddings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    namespace: str = "indian_law_corpus" # Defaults to general corpus
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
            
            # Query Pinecone - User's private documents
            search_results_user = None
            if request.namespace:
                try:
                    search_results_user = query_embeddings(query_embedding, namespace=request.namespace)
                except Exception as e:
                    logger.warning(f"Failed to query user namespace: {e}")
            
            # Query Pinecone - General Indian Law Corpus
            search_results_legal = None
            try:
                search_results_legal = query_embeddings(query_embedding, namespace="indian_law_corpus")
            except Exception as e:
                logger.warning(f"Failed to query legal corpus namespace: {e}")
            
            # Combine text from matches
            context_chunks = []
            if search_results_user and "matches" in search_results_user:
                user_chunks = [match.metadata.get("text", "") for match in search_results_user.matches if match.score > 0.7]
                context_chunks.extend(user_chunks)
                
            if search_results_legal and "matches" in search_results_legal:
                legal_chunks = [match.metadata.get("text", "") for match in search_results_legal.matches if match.score > 0.7]
                context_chunks.extend(legal_chunks)
                
            context = "\n---\n".join(context_chunks)
        
        # Generate answer
        answer = generate_answer(prompt=request.query, context=context)
        
        return ChatResponse(answer=answer)

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
