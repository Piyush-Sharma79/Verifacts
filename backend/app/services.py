import spacy
from typing import List
import faiss
import pickle
from sentence_transformers import SentenceTransformer
from langchain_ollama.chat_models import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


# --- Constants ---
INDEX_PATH = "faiss_index.bin"
DOC_CHUNKS_PATH = "doc_chunks.pkl"
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


def retrieve_documents(query: str, k: int = 3) -> List[str]:
    """
    Retrieves the k most relevant documents for a given query.
    """
    # Generate embedding for the query
    query_embedding = EMBEDDING_MODEL.encode([query])[0].reshape(1, -1).astype('float32')

    # Search in the FAISS index
    D, I = INDEX.search(query_embedding, k)

    # Retrieve the corresponding documents
    # Handle both string and Document object cases
    results = []
    for i in I[0]:
        doc = DOC_CHUNKS[i]
        # Check if it's a Document object with a page_content attribute
        if hasattr(doc, 'page_content'):
            results.append(doc.page_content)
        # Check if it's a dictionary with a 'content' key
        elif isinstance(doc, dict) and 'content' in doc:
            results.append(doc['content'])
        # Otherwise, assume it's a string
        else:
            results.append(str(doc))
    return results


def generate_verdict(claim: str, evidence: List[str]) -> str:
    """
    Generates a verdict for a claim based on the retrieved evidence.
    """
    evidence_text = "\n\n".join(evidence)
    verdict = GENERATION_CHAIN.invoke({"claim": claim, "evidence": evidence_text})
    return verdict
