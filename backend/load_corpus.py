import os
import sys
import uuid
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from services.llm import initialize_llms, get_embedding
import services.pinecone_service as ps

# A foundational Indian Legal Corpus
INDIAN_LEGAL_CORPUS = [
    {
        "id": "const-art-14",
        "title": "Article 14 of the Constitution of India",
        "text": "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India. This implies equality of treatment in equal circumstances.",
        "category": "Constitutional Law",
        "source": "Constitution of India"
    },
    {
        "id": "const-art-19",
        "title": "Article 19(1)(a) of the Constitution of India",
        "text": "All citizens shall have the right to freedom of speech and expression. However, this is subject to reasonable restrictions under Article 19(2) in the interests of the sovereignty and integrity of India, the security of the State, friendly relations with foreign States, public order, decency or morality, or in relation to contempt of court, defamation or incitement to an offence.",
        "category": "Constitutional Law",
        "source": "Constitution of India"
    },
    {
        "id": "const-art-21",
        "title": "Article 21 of the Constitution of India",
        "text": "No person shall be deprived of his life or personal liberty except according to procedure established by law. The Supreme Court has expanded this to include the right to a speedy trial, right to free legal aid, right to privacy, and right to live with dignity.",
        "category": "Constitutional Law",
        "source": "Constitution of India"
    },
    {
        "id": "contract-sec-10",
        "title": "Section 10 of the Indian Contract Act, 1872",
        "text": "What agreements are contracts: All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.",
        "category": "Contract Law",
        "source": "Indian Contract Act, 1872"
    },
    {
        "id": "contract-sec-11",
        "title": "Section 11 of the Indian Contract Act, 1872",
        "text": "Who are competent to contract: Every person is competent to contract who is of the age of majority according to the law to which he is subject, and who is of sound mind, and is not disqualified from contracting by any law to which he is subject.",
        "category": "Contract Law",
        "source": "Indian Contract Act, 1872"
    },
    {
        "id": "contract-sec-73",
        "title": "Section 73 of the Indian Contract Act, 1872",
        "text": "Compensation for loss or damage caused by breach of contract: When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach.",
        "category": "Contract Law",
        "source": "Indian Contract Act, 1872"
    },
    {
        "id": "ipc-sec-378",
        "title": "Section 378 of the Indian Penal Code (Theft)",
        "text": "Theft: Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft.",
        "category": "Criminal Law",
        "source": "Indian Penal Code, 1860"
    },
    {
        "id": "ipc-sec-415",
        "title": "Section 415 of the Indian Penal Code (Cheating)",
        "text": "Cheating: Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to cheat.",
        "category": "Criminal Law",
        "source": "Indian Penal Code, 1860"
    },
    {
        "id": "bns-sec-301",
        "title": "Section 301 of Bharatiya Nyaya Sanhita, 2023 (Snatching)",
        "text": "The Bharatiya Nyaya Sanhita introduced a specific provision for snatching. Theft is snatching if, in order to commit theft, the offender suddenly or quickly or forcibly seizes or secures or grabs or takes away from any person or from his possession any movable property.",
        "category": "Criminal Law",
        "source": "Bharatiya Nyaya Sanhita, 2023"
    },
    {
        "id": "cpa-2019-sec-2",
        "title": "Section 2(7) of the Consumer Protection Act, 2019 (Consumer)",
        "text": "Definition of Consumer: A consumer is any person who buys any goods for a consideration which has been paid or promised or partly paid and partly promised, or under any system of deferred payment. It does not include a person who obtains such goods for resale or for any commercial purpose.",
        "category": "Consumer Law",
        "source": "Consumer Protection Act, 2019"
    }
]

def main():
    logger.info("Initializing services...")
    initialize_llms()
    ps.initialize_pinecone()
    
    if not ps.index:
        logger.error("Pinecone index not initialized. Check your API keys and index name.")
        sys.exit(1)
        
    logger.info(f"Starting to load {len(INDIAN_LEGAL_CORPUS)} documents into Pinecone namespace 'indian_law_corpus'...")
    
    vectors_to_upsert = []
    
    for doc in INDIAN_LEGAL_CORPUS:
        logger.info(f"Generating embedding for: {doc['id']} - {doc['title']}")
        
        # Combine title and text for a richer embedding
        full_text = f"{doc['title']}\n{doc['text']}"
        embedding = get_embedding(full_text)
        
        if not embedding:
            logger.error(f"Failed to generate embedding for {doc['id']}. Skipping.")
            continue
            
        vectors_to_upsert.append({
            "id": doc["id"],
            "values": embedding,
            "metadata": {
                "title": doc["title"],
                "text": doc["text"],
                "category": doc["category"],
                "source": doc["source"]
            }
        })
        
    if vectors_to_upsert:
        logger.info(f"Upserting {len(vectors_to_upsert)} vectors to Pinecone...")
        ps.index.upsert(vectors=vectors_to_upsert, namespace="indian_law_corpus")
        logger.info("Successfully loaded the Indian Legal Corpus into Pinecone!")
    else:
        logger.warning("No vectors to upsert.")

if __name__ == "__main__":
    main()
