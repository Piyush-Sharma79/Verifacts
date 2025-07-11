from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from . import services

app = FastAPI(
    title="VeriFact API",
    description="API for the VeriFact application, a real-time AI fact-checker.",
    version="0.2.0",
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


class Document(BaseModel):
    content: str
    source: str
    source_type: str
    similarity: float
    metadata: Optional[Dict[str, Any]] = None


class VerdictResponse(BaseModel):
    claim: Optional[str] = None
    retrieved_documents: List[Document] = []
    verdict: Dict[str, Any] = {}
    process_time: Optional[float] = None


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


@app.post("/verify-claim/", response_model=VerdictResponse)
def post_verify_claim(submission: TextSubmission):
    """
    Receives text, extracts the first claim, retrieves relevant documents,
    and generates a final verdict with confidence rating.
    """
    import time
    start_time = time.time()

    # Extract claims from user input
    claims = services.extract_claims(submission.text)
    if not claims:
        return VerdictResponse(
            claim=None,
            retrieved_documents=[],
            verdict={"verdict": "No claim found", "explanation": "Could not extract a factual claim from the input text."},
            process_time=time.time() - start_time
        )

    # Use the first claim for verification
    first_claim = claims[0]

    # Retrieve relevant documents
    retrieved_docs = services.retrieve_documents(query=first_claim, k=5)

    # If no documents found, return early
    if not retrieved_docs:
        return VerdictResponse(
            claim=first_claim,
            retrieved_documents=[],
            verdict={
                "verdict": "Not Enough Information",
                "explanation": "Could not find any relevant information in the knowledge base.",
                "confidence": "low"
            },
            process_time=time.time() - start_time
        )

    # Generate verdict using the retrieved evidence
    verdict = services.generate_verdict(
        claim=first_claim,
        evidence=retrieved_docs
    )

    # Calculate total processing time
    process_time = time.time() - start_time

    # Return structured response
    return VerdictResponse(
        claim=first_claim,
        retrieved_documents=retrieved_docs,
        verdict=verdict,
        process_time=process_time
    )


@app.get("/knowledge-stats/")
def get_knowledge_stats():
    """
    Returns statistics about the knowledge base.
    """
    stats = {
        "total_documents": len(services.DOC_CHUNKS),
        "source_types": {}
    }

    # Count documents by source type
    for doc in services.DOC_CHUNKS:
        source_type = "unknown"
        if hasattr(doc, 'metadata'):
            source_type = doc.metadata.get('source_type', 'unknown')
        elif isinstance(doc, dict) and 'metadata' in doc:
            source_type = doc['metadata'].get('source_type', 'unknown')

        if source_type in stats["source_types"]:
            stats["source_types"][source_type] += 1
        else:
            stats["source_types"][source_type] = 1

    return stats
