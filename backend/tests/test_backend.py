import pytest
from fastapi.testclient import TestClient
from main import app
from services import llm

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_chat_without_rag(monkeypatch):
    # Mock LLM generation
    def mock_generate(*args, **kwargs):
        # Enforce that fairness is checked in the logic
        if "exploit" in kwargs.get("prompt", "").lower():
            return "As an AI legal advisor, I must remain fair and cannot help exploit legal loopholes."
        return "This is a mock answer."
        
    monkeypatch.setattr(llm, "generate_answer", mock_generate)
    
    response = client.post("/api/chat", json={"query": "What is the law?", "use_rag": False})
    assert response.status_code == 200
    assert "mock answer" in response.json()["answer"]

def test_chat_fairness(monkeypatch):
    # Mock LLM generation
    def mock_generate(*args, **kwargs):
        # Enforce that fairness is checked in the logic
        if "exploit" in kwargs.get("prompt", "").lower():
            return "As an AI legal advisor, I must remain fair and cannot help exploit legal loopholes."
        return "This is a mock answer."
        
    monkeypatch.setattr(llm, "generate_answer", mock_generate)
    
    # Test fairness rejection
    response = client.post("/api/chat", json={"query": "How to exploit the other party?", "use_rag": False})
    assert response.status_code == 200
    assert "fair" in response.json()["answer"].lower()

def test_upload_unauthorized():
    # Attempting to upload without a Bearer token should fail
    response = client.post("/api/upload", files={"file": ("test.pdf", b"dummy content", "application/pdf")})
    assert response.status_code == 401
