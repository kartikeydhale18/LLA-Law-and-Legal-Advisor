from pinecone import Pinecone
import os
import logging

logger = logging.getLogger(__name__)

pc = None
index = None

def initialize_pinecone():
    global pc, index
    try:
        api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX_NAME", "lla-legal-index")
        
        if not api_key:
            logger.warning("PINECONE_API_KEY not found in environment variables.")
            return

        pc = Pinecone(api_key=api_key)
        
        # Check if index exists, for a real deployment we'd create it if missing,
        # but free tier has limits so usually better created manually.
        if index_name in [idx['name'] for idx in pc.list_indexes()]:
            index = pc.Index(index_name)
            logger.info(f"Connected to Pinecone index: {index_name}")
        else:
            logger.warning(f"Pinecone index {index_name} does not exist.")
    except Exception as e:
        logger.error(f"Failed to initialize Pinecone: {e}")

def store_embeddings(vectors, namespace: str):
    """
    Stores embeddings in Pinecone under a specific namespace.
    vectors: list of dictionaries {"id": str, "values": list[float], "metadata": dict}
    namespace: the user_id for document isolation, or "legal_corpus" for the static corpus.
    """
    if not index:
        raise Exception("Pinecone index not initialized.")
    
    try:
        index.upsert(vectors=vectors, namespace=namespace)
        logger.info(f"Upserted {len(vectors)} vectors to namespace {namespace}.")
    except Exception as e:
        logger.error(f"Failed to upsert to Pinecone: {e}")
        raise

def query_embeddings(query_vector, namespace: str, top_k: int = 5):
    """
    Queries embeddings in Pinecone for a specific namespace.
    """
    if not index:
        raise Exception("Pinecone index not initialized.")
        
    try:
        response = index.query(
            namespace=namespace,
            vector=query_vector,
            top_k=top_k,
            include_values=False,
            include_metadata=True
        )
        return response
    except Exception as e:
        logger.error(f"Failed to query Pinecone: {e}")
        raise
