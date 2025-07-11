# VeriFact: Real-Time AI Fact-Checker

A RAG-powered fact-checking application that verifies claims using Wikipedia and news sources.

## Project Overview

VeriFact is an AI-powered fact-checking tool built for the DeepDive 1.0 Hackathon (Round 2) under the "Reliable Knowledge – Fact-Checking & Research" theme. The application uses Retrieval-Augmented Generation (RAG) to verify factual claims by retrieving evidence from reliable sources and generating verdicts with citations.

## Features

- **Claim Extraction**: Automatically identifies factual claims in user input
- **RAG Pipeline**: Uses FAISS vector search to find relevant information
- **Evidence Display**: Shows supporting evidence with source information
- **Confidence Ratings**: Indicates the reliability of the verdict
- **Pre-indexed Data**: Includes Wikipedia and news data ready for immediate use

## Quick Start

This repository includes pre-built document chunks and FAISS indexes, so you can start using the application immediately without having to re-index data. The `faiss_index.bin` and `doc_chunks.pkl` files are located in the root folder of the project.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd front
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the frontend at http://localhost:5173

### Backend Setup

1. Create and activate a virtual environment (recommended):
```bash
# Run these commands from the root directory
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install backend dependencies:
```bash
# Make sure you're in the root directory
pip install -r requirements/backend.txt
```

3. Start the FastAPI server:
```bash
# Navigate to the backend directory first
cd backend
uvicorn main:app --reload
```

4. The API will be available at http://localhost:8000

## Using the Application

1. Open your browser and navigate to http://localhost:5173
2. Enter a factual claim in the input field (or select one of the example claims)
3. Click "Verify Now" to start the fact-checking process
4. View the results with the verdict, confidence rating, and supporting evidence

## Pre-loaded Data

This repository includes pre-processed data to allow immediate use:
- Main index files in the root directory:
  - `faiss_index.bin`: Vector database for semantic search
  - `doc_chunks.pkl`: Processed document chunks
- Additional data in data folders:
  - Wikipedia article chunks in `data/wiki/`
  - News article chunks in `data/news/`

You do not need to run any data processing scripts as all necessary data is included.

## Project Structure

```
verifact/
├── front/                 # React frontend with TailwindCSS
├── backend/               # FastAPI backend
├── data/                  # Additional data files
│   ├── wiki/              # Wikipedia data
│   └── news/              # News data
├── scripts/               # Utility scripts for data processing
├── requirements/          # Dependency files
│   └── backend.txt        # Backend Python dependencies
├── doc_chunks.pkl         # Pre-processed document chunks (in root)
├── faiss_index.bin        # FAISS vector index (in root)
├── README.md              # This file
├── QUICKSTART.md          # Simplified setup instructions
└── DEVELOPER_NOTES.md     # Technical documentation
```

## Technology Stack

- **Frontend**: React, TailwindCSS
- **Backend**: FastAPI, Python
- **LLM Engine**: Qwen3 (via Ollama)
- **RAG System**: LangChain, FAISS
- **Data Sources**: Wikipedia, News APIs

## Troubleshooting

- **Backend connection error**: Ensure the FastAPI server is running on port 8000
- **Missing LLM responses**: Check that Ollama is installed and the Qwen3 model is available
- **Slow response times**: The first query may take longer as the LLM loads

## Credits

Created for the 2025 AI Hackathon (DeepDive 1.0 – Round 2)
