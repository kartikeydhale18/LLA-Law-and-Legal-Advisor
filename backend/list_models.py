import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(override=True)

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("No Groq API Key found")
    exit(1)

client = Groq(api_key=groq_api_key)

try:
    print("Available Groq Models:")
    models = client.models.list()
    for m in models.data:
        print(m.id)
except Exception as e:
    print(f"Error listing Groq models: {e}")
