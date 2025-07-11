# VeriFact: AI-Powered Fact-Checking Application

VeriFact is a real-time AI fact-checking application that uses Retrieval-Augmented Generation (RAG) to verify claims against reliable sources. The application consists of a FastAPI backend and a React frontend.

## Features

- **Claim Extraction**: Automatically identifies factual claims in user input using spaCy
- **Evidence Retrieval**: Uses vector search (FAISS) to find relevant information from knowledge sources
- **AI Verification**: Analyzes evidence against claims using LLMs to provide verdicts
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
│   ├── Eiffel_Tower.txt
│   ├── Statue_of_Liberty.txt
│   └── Big_Ben.txt
├── scripts/              # Utility scripts
│   ├── create_index.py   # Create FAISS index from data
│   └── fetch_data.py     # Fetch Wikipedia articles
├── doc_chunks.pkl        # Processed document chunks
└── faiss_index.bin       # Vector index for search
```

## Installation and Setup

### Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- Ollama (for local LLM support)

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
pip install fastapi uvicorn langchain langchain_ollama sentence-transformers faiss-cpu spacy
python -m spacy download en_core_web_sm
```

3. Set up Ollama:
   - Install Ollama from [https://ollama.com/](https://ollama.com/)
   - Pull the Qwen model: `ollama pull qwen3:8b`

4. Create the knowledge index:

```bash
cd ..  # Return to project root
python scripts/fetch_data.py  # Fetch Wikipedia articles
python scripts/create_index.py  # Create FAISS index
```

5. Start the backend server:

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
4. View the verdict and supporting evidence

## Expanding the Knowledge Base

To add more topics to the knowledge base:

1. Add new article titles in `scripts/fetch_data.py`:
   ```python
   WIKI_PAGES = ["Eiffel Tower", "Statue of Liberty", "Big Ben", "Your New Topic"]
   ```

2. Run the data fetching and indexing scripts:
   ```bash
   python scripts/fetch_data.py
   python scripts/create_index.py
   ```

## Future Enhancements

- Integration with NewsAPI for current events fact-checking
- Expanded Wikipedia knowledge base
- UI improvements with confidence indicators
- Support for analyzing news headlines and social media content

## License

This project is for educational purposes only. Not for commercial use.
