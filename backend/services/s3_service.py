import os
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
import uuid
import logging

logger = logging.getLogger(__name__)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
) if AWS_ACCESS_KEY_ID else None

async def upload_file_to_s3(file_bytes: bytes, filename: str, content_type: str, user_id: str) -> str:
    """
    Uploads a file to AWS S3 and returns the public URL or S3 key.
    """
    if not s3_client or not AWS_S3_BUCKET_NAME:
        logger.warning("AWS S3 not configured. Skipping S3 upload.")
        return None

    try:
        # Create a unique filename
        file_extension = filename.split(".")[-1] if "." in filename else ""
        unique_filename = f"{user_id}/{uuid.uuid4()}.{file_extension}"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=unique_filename,
            Body=file_bytes,
            ContentType=content_type
        )
        
        # Construct the URL (assuming bucket is configured for public read, or just returning the URI)
        s3_url = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        logger.info(f"Successfully uploaded file to S3: {s3_url}")
        
        return s3_url
    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during S3 upload: {e}")
        return None
