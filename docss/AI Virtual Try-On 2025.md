# VeriFact: Technical Implementation Plan for DeepDive Hackathon Prototype

## Implementation Overview
The VeriFact project will use a Retrieval-Augmented Generation (RAG) approach, combining document retrieval and LLM reasoning to verify claims in real time.

### NLP Claim Extraction
- Use spaCy or a transformer-based model (e.g. BERT fine-tuned for NER and claim detection) to identify factual statements in user input.

# Retrieval with RAGatouille
- **RAGatouille:** A performant RAG pipeline built on FAISS vector database, integrated with LangChain.
- Workflow:
  - Convert input claim to embedding.
  - Query FAISS index of Wikipedia dumps, NewsAPI articles, and Google Fact Check data.
  - Retrieve top-k relevant snippets.

### Evidence Synthesis & Verdict
- Construct a prompt template combining retrieved evidence with the original claim.
- Pass this prompt to GPT-4 (via API) or a local LLaMA model (using llama.cpp) to generate a concise verdict with reasoning.

### Web UI & Backend
- **Frontend:** React.js with a simple chat interface for claim submission and verdict display.
- **Backend:** FastAPI to handle requests, call NLP extraction, manage retrieval via RAGatouille, and interface with the LLM.

### Deployment Plan
- Host on Vercel (frontend) and deploy backend APIs on Heroku for quick scalability.
- Integrate LangChain for structured retrieval and LLM orchestration.

### Next Steps
1. Finalize retrieval dataset sources and indexing pipeline.
2. Build basic claim extraction and retrieval pipeline.
3. Integrate LLM verdict generation with source highlighting.
4. Complete UI and record demo by 11th July deadline.

---

If you want, I can draft the next breakdowns for actual FastAPI route plans, LangChain chains setup, and prompt templates for your coding sessions today.
