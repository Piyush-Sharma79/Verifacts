I'll provide a detailed explanation of our VeriFact application, focusing on the server-side code, technology stack, and architecture.
Ran tool
Ran tool
Read file: backend/app/main.py
Read file: backend/app/services.py
Ran tool
Ran tool
Read file: front/src/App.tsx
Read file: front/package.json
Read file: plans.txt
Read file: knowledge and tech used.txt
Now I'll provide a detailed explanation of our VeriFact application, focusing on the server-side code, technologies, and architecture:

## VeriFact Server-Side Architecture

### 1. Backend Technology Stack

- **Framework**: FastAPI - A modern, high-performance web framework for building APIs with Python
- **Language**: Python 3.x
- **NLP Engine**: spaCy with the 'en_core_web_sm' model for natural language processing
- **Vector Database**: FAISS (Facebook AI Similarity Search) for efficient similarity search
- **Embeddings**: Sentence Transformer (BAAI/bge-small-en-v1.5) for generating document embeddings
- **LLM Integration**: Ollama with Qwen3 8B model for generating verdicts
- **RAG (Retrieval-Augmented Generation)**: Custom implementation using FAISS, SentenceTransformer, and LangChain
- **Serialization**: Pickle for storing document chunks

### 2. Main Backend Components (app/main.py)

The main.py file sets up the FastAPI application and defines the API endpoints:

1. **FastAPI Application Setup**:
   - Creates a FastAPI application with metadata
   - Configures CORS (Cross-Origin Resource Sharing) to allow frontend-backend communication

2. **API Endpoints**:
   - `GET /` - Root endpoint that returns a status check
   - `POST /extract-claims/` - Extracts factual claims from submitted text
   - `POST /verify-claim/` - The main endpoint that:
     - Extracts claims from text
     - Retrieves relevant documents
     - Generates a verdict based on evidence
     - Returns claim, documents, and verdict to the frontend

3. **Data Models**:
   - `TextSubmission` - A Pydantic model for receiving text input

### 3. Services Implementation (app/services.py)

This file contains the core functionality of our fact-checking system:

1. **Global Components**:
   - `NLP` - spaCy model for text processing
   - `INDEX` - FAISS vector index for document retrieval
   - `DOC_CHUNKS` - Stored document chunks for reference
   - `EMBEDDING_MODEL` - SentenceTransformer for creating vector embeddings
   - `LLM` - Ollama LLM integration using ChatOllama from langchain_ollama
   - `PROMPT_TEMPLATE` - Structured prompt for the LLM to generate verdicts
   - `GENERATION_CHAIN` - LangChain pipeline connecting prompt to LLM

2. **Key Functions**:

   - `extract_claims(text)`:
     - Processes input text to extract factual claims
     - Handles both single statements and longer texts
     - Uses spaCy for sentence detection in multi-sentence inputs

   - `retrieve_documents(query, k=3)`:
     - Takes a claim and finds k most relevant documents
     - Converts the query to a vector embedding
     - Searches the FAISS index for similar document vectors
     - Returns the content of matched documents

   - `generate_verdict(claim, evidence)`:
     - Takes a claim and retrieved evidence
     - Constructs a prompt with the claim and evidence
     - Sends to LLM through LangChain
     - Returns structured verdict with reasoning

### 4. Technical Implementation Details

1. **Vector Search Process**:
   - The FAISS index contains pre-embedded document vectors
   - When a query comes in, it's converted to the same embedding space
   - FAISS performs efficient nearest neighbor search to find similar documents
   - Results are ranked by similarity score

2. **Claim Extraction Logic**:
   - For short inputs (< 20 words without periods), treats the entire input as a single claim
   - For longer texts, uses spaCy's sentence segmentation
   - Falls back to the original text if no sentences are detected

3. **LLM Prompt Engineering**:
   - Structured prompt instructs the LLM to:
     - Analyze claim and evidence
     - Generate a verdict (Supported/Refuted/Not Enough Information)
     - Provide explanation with reference to specific evidence
     - Include sources from the evidence

4. **Data Flow**:
   - User submits text → Backend extracts claim → Retrieves documents → Generates verdict → Returns structured response

### 5. Pre-processing and Data Requirements

- The system requires:
  - A pre-built FAISS index (`faiss_index.bin`)
  - Pre-processed document chunks (`doc_chunks.pkl`)
  - Access to an Ollama instance running the Qwen3:8b model

## Frontend Integration

The frontend (built with React, TypeScript, and Tailwind CSS) connects to these backend services through HTTP requests to the FastAPI endpoints. It provides:

1. A form for submitting claims
2. A workflow visualization showing the verification process
3. Display components for the claim, verdict, and supporting evidence
4. Example claims users can try

## How the Workflow Functions

1. User submits a factual statement through the frontend
2. The backend extracts the primary claim using NLP
3. The system converts the claim to a vector and searches the knowledge base using FAISS
4. Relevant documents are retrieved and sent to the LLM along with the claim
5. The LLM analyzes the evidence and generates a structured verdict
6. The response is returned to the frontend and displayed with appropriate formatting

This RAG-based approach allows for fact verification that is:
- Grounded in real data (unlike pure LLM responses)
- Transparent (shows evidence and reasoning)
- Adaptable (knowledge base can be updated)

The system combines the best of both worlds: efficient vector search for retrieval and LLM reasoning capabilities for verdict generation and explanation.
