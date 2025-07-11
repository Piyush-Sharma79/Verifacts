# VeriFact: Developer Documentation

This document provides technical details about VeriFact's implementation for developers who want to understand the system architecture or extend its functionality.

## Architecture Overview

VeriFact uses a client-server architecture with these main components:

1. **React Frontend** - User interface for submitting claims and viewing results
2. **FastAPI Backend** - Processes claims and interacts with the RAG pipeline
3. **RAG Pipeline** - The core fact-checking system using retrieval augmented generation
4. **Vector Store** - FAISS index for efficient semantic search
5. **LLM Integration** - Ollama/Qwen3 for reasoning and verdict generation

## Core RAG Pipeline

The fact-checking process follows these steps:

1. **Claim Extraction**: Uses spaCy to identify and extract factual claims from user input
2. **Vector Encoding**: Converts the claim to a vector embedding
3. **Retrieval**: Searches the FAISS index for semantically similar document chunks
4. **Context Building**: Assembles retrieved documents into a context prompt
5. **LLM Processing**: Sends the claim and context to the LLM for analysis
6. **Verdict Generation**: Structures the LLM output into a verdict with explanation

## Data Processing Flow

The pre-processed data included in this repository was created through this pipeline:

1. **Data Collection**:
   - Wikipedia articles fetched using Wikipedia API
   - News articles collected from NewsAPI.org

2. **Text Processing**:
   - Documents split into chunks of appropriate size
   - Overlapping chunks created to preserve context
   - Metadata attached to each chunk

3. **Vector Indexing**:
   - Document chunks converted to embeddings using SentenceTransformers
   - Embeddings stored in a FAISS index for efficient retrieval

## File Organization

- **Root Directory**:
  - `faiss_index.bin`: The main vector index used for semantic search
  - `doc_chunks.pkl`: Processed document chunks with metadata

- **Data Folders**:
  - `data/wiki/`: Raw Wikipedia article data
  - `data/news/`: News article data

- **Code**:
  - `backend/`: FastAPI application and services
    - `backend/app/`: Main application module
    - `backend/app/main.py`: FastAPI application entry point
    - `backend/app/services/`: Backend services for claim extraction, retrieval, etc.
  - `front/`: React frontend application
  - `scripts/`: Data processing and indexing scripts

- **Dependencies**:
  - `requirements/backend.txt`: Python dependencies for the backend

## Development Environment Setup

1. **Backend Setup**:
   ```bash
   # Navigate to the backend directory
   cd backend

   # Create a virtual environment in the backend directory
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r ../requirements/backend.txt

   # Start the development server
   uvicorn app.main:app --reload
   ```

2. **Frontend Setup**:
   ```bash
   # Navigate to the frontend directory
   cd front

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```

## Extending the Knowledge Base

To update or expand the knowledge base:

1. **Add Wikipedia Articles**:
   - Modify `scripts/fetch_more_wiki.py` to include new topics
   - Run the script to download articles to `data/wiki/`

2. **Update News Data**:
   - Run `scripts/fetch_news.py` to retrieve recent news
   - Configure news categories and sources in the script
   - News will be saved to `data/news/`

3. **Rebuild the Index**:
   - After adding new data, run `scripts/create_enhanced_index.py`
   - This will regenerate `doc_chunks.pkl` and `faiss_index.bin` in the root directory

## API Endpoints

### Main Endpoints

- `GET /` - Health check endpoint
- `POST /extract-claims/` - Extract claims from text
- `POST /verify-claim/` - Verify a specific claim
- `GET /knowledge-stats/` - Get statistics about the knowledge base

### Request/Response Formats

#### Extract Claims
```
POST /extract-claims/
{
  "text": "The Eiffel Tower is 330 meters tall."
}

Response:
{
  "claims": ["The Eiffel Tower is 330 meters tall."]
}
```

#### Verify Claim
```
POST /verify-claim/
{
  "claim": "The Eiffel Tower is 330 meters tall."
}

Response:
{
  "claim": "The Eiffel Tower is 330 meters tall.",
  "verdict": {
    "verdict": "Supported",
    "explanation": "The claim is accurate...",
    "confidence": "high"
  },
  "retrieved_documents": [
    {
      "content": "...",
      "source": "Wikipedia: Eiffel Tower",
      "source_type": "wikipedia",
      "similarity": 0.87
    },
    ...
  ],
  "process_time": 2.34
}
```

## Configuration Options

The application can be configured through environment variables:

- `OLLAMA_BASE_URL`: URL for the Ollama API (default: http://localhost:11434)
- `MODEL_NAME`: LLM model to use (default: qwen3:8b)
- `WIKIPEDIA_ARTICLE_COUNT`: Max number of Wikipedia articles to fetch
- `NEWS_API_KEY`: API key for NewsAPI.org (for refreshing news data)
- `NEWS_ARTICLE_COUNT`: Max number of news articles to fetch

## Customizing the LLM

By default, VeriFact uses Qwen3:8b via Ollama, but you can customize this:

1. To use a different local model:
   - Pull the model with Ollama: `ollama pull mistral:7b`
   - Set the `MODEL_NAME` environment variable

2. To use an API-based LLM:
   - Modify `backend/app/services/llm_service.py` to use an API-based provider
   - Add appropriate authentication in the environment variables

## Frontend Component Structure

The React frontend is organized as follows:

- `front/src/App.tsx` - Main application component
- `front/src/components/` - Reusable UI components
- `front/src/services/` - API client functions
- `front/src/types/` - TypeScript type definitions

## Performance Considerations

- The first query may take longer as the LLM loads into memory
- The FAISS index is loaded at server startup, which might cause a brief delay
- Vector search performance scales with the size of the knowledge base

## Troubleshooting for Developers

- **Missing chunks or index files**: Verify that `faiss_index.bin` and `doc_chunks.pkl` are in the root directory
- **LLM connection issues**: Verify Ollama is running and the model is pulled
- **ASGI import error**: If you get "Could not import module 'main'", make sure you're running `uvicorn app.main:app --reload` from the `backend` directory
- **Slow retrieval**: Consider optimizing the FAISS index parameters in the indexing script
