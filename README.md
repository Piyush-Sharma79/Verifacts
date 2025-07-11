# VeriFact: AI-Powered Fact-Checking Application

VeriFact is a real-time AI fact-checking application that uses Retrieval-Augmented Generation (RAG) to verify claims against reliable sources. The application consists of a FastAPI backend and a React frontend.

## Features

- **Claim Extraction**: Automatically identifies factual claims in user input using spaCy
- **Evidence Retrieval**: Uses vector search (FAISS) to find relevant information from knowledge sources
- **AI Verification**: Analyzes evidence against claims using LLMs to provide verdicts
- **Multiple Knowledge Sources**: Combines Wikipedia articles and recent news for comprehensive fact-checking
- **Confidence Indicators**: Shows reliability of verdicts based on evidence quality and source diversity
- **User-Friendly Interface**: Modern UI with visualization of the fact-checking process
- **Transparent Results**: Shows supporting evidence alongside verdicts for transparency

## Project Structure

```
facts/
├── backend/              # FastAPI server
│   ├── app/
│   │   ├── main.py       # API endpoints
│   │   └── services.py   # Core functionality
│   └── venv/             # Python virtual environment
├── front/                # React frontend
│   ├── src/              # React components and logic
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
├── data/                 # Knowledge base files
│   ├── wiki/             # Wikipedia articles
│   └── news/             # News articles from NewsAPI
├── scripts/              # Utility scripts
│   ├── create_enhanced_index.py  # Create FAISS index from multiple sources
│   ├── fetch_more_wiki.py        # Fetch extended Wikipedia articles
│   ├── fetch_news.py             # Fetch current news articles
│   ├── create_index.py           # Legacy index creator
│   └── fetch_data.py             # Legacy data fetcher
├── doc_chunks.pkl        # Processed document chunks
├── faiss_index.bin       # Vector index for search
└── env.template          # Template for environment variables
```

## Installation and Setup

### Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- Ollama (for local LLM support)
- NewsAPI key (for news article retrieval)

### Backend Setup

1. Create and activate a Python virtual environment:

```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install fastapi uvicorn langchain langchain_ollama sentence-transformers faiss-cpu spacy wikipedia-api python-dotenv
python -m spacy download en_core_web_sm
```

3. Set up Ollama:
   - Install Ollama from [https://ollama.com/](https://ollama.com/)
   - Pull the Qwen model: `ollama pull qwen3:8b`

4. Set up environment variables:
   - Copy `env.template` to `.env`
   - Add your NewsAPI key to `.env`

5. Create the knowledge index:

```bash
# Fetch Wikipedia articles
python scripts/fetch_more_wiki.py

# Fetch news articles (requires NewsAPI key)
python scripts/fetch_news.py

# Create the enhanced index
python scripts/create_enhanced_index.py
```

6. Start the backend server:

```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

### Frontend Setup

1. Install frontend dependencies:

```bash
cd front
npm install
```

2. Start the development server:

```bash
npm run dev
```

## Usage

1. Open your browser to `http://localhost:5173` (or the port shown in your terminal)
2. Enter a factual claim in the text area (e.g., "The Eiffel Tower is 330 meters tall")
3. Click "Verify" to process the claim
4. View the verdict, confidence level, and supporting evidence

## Expanding the Knowledge Base

### Adding More Wikipedia Articles

1. Edit `scripts/fetch_more_wiki.py` to add more topics:
   ```python
   WIKI_PAGES = [
       "Existing Topic",
       "Your New Topic"
   ]
   ```

2. Run the scripts to update your knowledge base:
   ```bash
   python scripts/fetch_more_wiki.py
   python scripts/create_enhanced_index.py
   ```

### Updating News Articles

News articles can be refreshed periodically to keep your knowledge base current:

```bash
python scripts/fetch_news.py
python scripts/create_enhanced_index.py
```

## API Endpoints

- `GET /`: API health check
- `POST /extract-claims/`: Extract factual claims from text
- `POST /verify-claim/`: Verify a claim against the knowledge base
- `GET /knowledge-stats/`: Get statistics about the knowledge base

## Future Enhancements

- Integration with more specialized fact-checking databases
- User accounts to track verification history
- Browser extension for checking claims while browsing
- Multi-language support
- Mobile application

## License

This project is for educational purposes only. Not for commercial use.
