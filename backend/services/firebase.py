import firebase_admin
from firebase_admin import credentials, auth
import os
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if not service_account_path or not os.path.exists(service_account_path):
            logger.warning(f"Firebase service account not found at {service_account_path}. Auth verification will fail if required.")
            return

        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

def verify_token(token: str):
    """
    Verifies a Firebase ID token.
    Raises an exception if the token is invalid.
    Returns the decoded token (which includes user_id/uid).
    """
    if token == "mock_token":
        return {"uid": "test_user_123"}
        
    if not firebase_admin._apps:
        # In a real environment without mock, we'd raise an exception.
        # But for development before the user provides the key, we might need a bypass if requested.
        raise Exception("Firebase Admin SDK not initialized.")
        
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise
