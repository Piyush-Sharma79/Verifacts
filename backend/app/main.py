from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

from . import services

app = FastAPI(
    title="VeriFact API",
    description="API for the VeriFact application, a real-time AI fact-checker.",
    version="0.1.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextSubmission(BaseModel):
    text: str


@app.get("/")
def read_root():
    """
    Root endpoint to check if the API is running.
    """
    return {"status": "ok", "message": "Welcome to the VeriFact API!"}


@app.post("/extract-claims/", response_model=List[str])
def post_extract_claims(submission: TextSubmission):
    """
    Receives text and extracts potential factual claims.
    """
    claims = services.extract_claims(submission.text)
    return claims


@app.post("/verify-claim/", response_model=Dict[str, Any])
def post_verify_claim(submission: TextSubmission):
    """
    Receives text, extracts the first claim, retrieves relevant documents,
    and generates a final verdict.
    """
    claims = services.extract_claims(submission.text)
    if not claims:
        return {"claim": None, "retrieved_documents": [], "verdict": "No claim found."}

    first_claim = claims[0]
    retrieved_docs = services.retrieve_documents(query=first_claim, k=3)

    verdict = services.generate_verdict(
        claim=first_claim,
        evidence=retrieved_docs
    )

    return {
        "claim": first_claim,
        "retrieved_documents": retrieved_docs,
        "verdict": verdict,
    }
