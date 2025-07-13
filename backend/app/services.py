import spacy
from typing import List, Dict, Any, Union
import faiss
import pickle
from sentence_transformers import SentenceTransformer
from langchain_ollama.chat_models import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from datetime import datetime


# --- Constants ---
INDEX_PATH = "./faiss_index.bin"
DOC_CHUNKS_PATH = "./doc_chunks.pkl"
MODEL_NAME = "BAAI/bge-small-en-v1.5"
OLLAMA_MODEL = "qwen3:8b"
# ---------------------

# --- Global Components ---
# Load all models and data once when the service starts
print("Loading models and data for services...")
NLP = spacy.load("en_core_web_sm")
INDEX = faiss.read_index(INDEX_PATH)
with open(DOC_CHUNKS_PATH, "rb") as f:
    DOC_CHUNKS = pickle.load(f)
EMBEDDING_MODEL = SentenceTransformer(MODEL_NAME)

LLM = ChatOllama(model=OLLAMA_MODEL)
PROMPT_TEMPLATE = PromptTemplate.from_template(
    """
    You are a meticulous fact-checker. Your role is to analyze a claim and the provided evidence, then determine if the claim is supported by the evidence.

    **Claim:**
    {claim}

    **Evidence:**
    {evidence}

    **Your Task:**
    1. Carefully read the claim and the evidence.
    2. Compare the claim against the information presented in the evidence.
    3. Provide a concise, one-sentence verdict: "Supported", "Refuted", or "Not Enough Information".
    4. Provide a brief explanation for your verdict. Reference specific information from the evidence.
    5. If relevant, provide the source of the supporting or refuting information.

    **Format your response as follows:**
    Verdict: [Your verdict]
    Explanation: [Your explanation]
    Sources: [Sources from evidence, if available]

    Keep in mind the reliability and recency of the sources. News articles may be more current but Wikipedia articles may be more comprehensive for historical facts.
    """
)
GENERATION_CHAIN = PROMPT_TEMPLATE | LLM | StrOutputParser()

# ---------------------


def extract_claims(text: str) -> List[str]:
    """
    Extracts potential factual claims from a given text.
    For a more comprehensive approach, we'll use the entire input as the claim
    if it appears to be a single statement, or try to extract sentences otherwise.
    """
    # Clean and normalize the text
    cleaned_text = text.strip()

    # If the text is short (likely a single claim), return it as is
    if len(cleaned_text.split()) < 20 and "." not in cleaned_text:
        return [cleaned_text]

    # Otherwise, try to split into sentences for multiple claims
    doc = NLP(cleaned_text)
    claims = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 0]

    # If no sentences were found, fall back to the original text
    if not claims:
        return [cleaned_text]

    return claims


def retrieve_documents(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """
    Retrieves the k most relevant documents for a given query.
    Returns a list of dictionaries with document content and metadata.
    """
    # Generate embedding for the query
    query_embedding = EMBEDDING_MODEL.encode([query])[0].reshape(1, -1).astype('float32')

    # Search in the FAISS index
    D, I = INDEX.search(query_embedding, k)

    # Retrieve the corresponding documents with metadata
    results = []
    for i, idx in enumerate(I[0]):
        if idx < 0 or idx >= len(DOC_CHUNKS):  # Safety check
            continue

        doc = DOC_CHUNKS[idx]
        similarity_score = float(D[0][i])  # Convert from numpy to Python float

        # Extract content and metadata
        content = ""
        metadata = {}
        source_type = "unknown"

        # Handle different document formats
        if hasattr(doc, 'page_content'):
            content = doc.page_content
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            source_type = metadata.get('source_type', 'unknown')
        elif isinstance(doc, dict):
            content = doc.get('content', str(doc))
            metadata = doc.get('metadata', {})
            source_type = metadata.get('source_type', 'unknown')
        else:
            content = str(doc)

        # Format document for display
        doc_info = {
            "content": content,
            "source_type": source_type,
            "source": metadata.get('source', 'Unknown source'),
            "similarity": similarity_score,
            "metadata": metadata
        }

        results.append(doc_info)

    # Sort by similarity score
    results = sorted(results, key=lambda x: x['similarity'])

    return results


def generate_verdict(claim: str, evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a verdict for a claim based on the retrieved evidence.
    Returns a dictionary with verdict information.
    """
    # Format evidence text for the LLM
    evidence_texts = []
    for i, doc in enumerate(evidence):
        source_info = f"SOURCE {i+1} [{doc['source_type']}]: {doc['source']}"
        content = doc['content']
        evidence_texts.append(f"{source_info}\n{content}")

    evidence_text = "\n\n" + "\n\n".join(evidence_texts)

    # Get raw verdict from LLM
    raw_verdict = GENERATION_CHAIN.invoke({"claim": claim, "evidence": evidence_text})

    # Try to parse the verdict structure
    verdict_info = parse_verdict(raw_verdict)

    # Add timestamp and evidence sources
    verdict_info["timestamp"] = datetime.now().isoformat()
    verdict_info["evidence_sources"] = [doc["source"] for doc in evidence]

    # Determine confidence level
    verdict_info["confidence"] = determine_confidence(verdict_info, evidence)

    return verdict_info


def parse_verdict(raw_verdict: str) -> Dict[str, str]:
    """
    Parses the raw verdict text into structured components.
    """
    verdict_info = {
        "raw": raw_verdict,
        "verdict": "Unknown",
        "explanation": "",
        "sources": ""
    }

    lines = raw_verdict.split('\n')
    for line in lines:
        line = line.strip()
        if line.lower().startswith("verdict:"):
            verdict_info["verdict"] = line[8:].strip()
        elif line.lower().startswith("explanation:"):
            verdict_info["explanation"] = line[12:].strip()
        elif line.lower().startswith("sources:"):
            verdict_info["sources"] = line[8:].strip()

    return verdict_info


def determine_confidence(verdict_info: Dict[str, str], evidence: List[Dict[str, Any]]) -> str:
    """
    Determines the confidence level based on verdict and evidence quality.
    """
    verdict_text = verdict_info["verdict"].lower()

    # Default to medium confidence
    confidence = "medium"

    # Check for explicit uncertainty in the verdict
    if "not enough information" in verdict_text or "uncertain" in verdict_text:
        confidence = "low"

    # Check evidence sources
    wiki_count = sum(1 for doc in evidence if doc["source_type"] == "wikipedia")
    news_count = sum(1 for doc in evidence if doc["source_type"] == "news")

    # If we have multiple sources of different types, higher confidence
    if wiki_count > 0 and news_count > 0:
        confidence = "high" if confidence != "low" else "medium"

    # If we have only news sources for a historical claim, lower confidence
    if wiki_count == 0 and news_count > 0 and "historical" in verdict_info["explanation"].lower():
        confidence = "low"

    # If the verdict is very certain based on wording, raise confidence
    if "clearly" in verdict_info["explanation"].lower() or "definitively" in verdict_info["explanation"].lower():
        confidence = "high" if confidence != "low" else "medium"

    return confidence
