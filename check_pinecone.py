import os
import sys
from dotenv import load_dotenv

# Load env vars
load_dotenv(override=True)

# Add backend directory to sys path so we can import modules
sys.path.append(os.path.abspath('backend'))

import logging
logging.basicConfig(level=logging.INFO)

from backend.services import pinecone_service

try:
    pinecone_service.initialize_pinecone()
    if not pinecone_service.index:
        print("Failed to initialize Pinecone index (index is None)")
        exit(1)
    
    stats = pinecone_service.index.describe_index_stats()
    print("Index stats:")
    print(stats)

    # Query test_user namespace
    print(f"Namespaces: {stats.namespaces}")
except Exception as e:
    print(f"Error: {e}")
