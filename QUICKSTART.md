# VeriFact Quick Start Guide

This guide provides the minimal steps needed to get VeriFact up and running quickly.

## Prerequisites

- Python 3.9+ with pip
- Node.js with npm
- [Ollama](https://ollama.com/) installed (for LLM)

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/verifact.git
cd verifact
```

### 2. Frontend Setup (React)

```bash
# Navigate to the front directory
cd front
npm install
npm run dev
```

The frontend will be available at: http://localhost:5173

### 3. Backend Setup (FastAPI)

```bash
# From the root directory of the project
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies from the requirements folder
pip install -r requirements/backend.txt

# Navigate to the backend directory to start the server
cd backend
uvicorn main:app --reload
```

The API will be available at: http://localhost:8000

### 4. Set Up Ollama (Required for LLM)

If not already installed:
1. Install Ollama from [ollama.com](https://ollama.com/)
2. Pull the Qwen3 model:
```bash
ollama pull qwen3:8b
```

### 5. Using the Application

1. Open your browser and go to http://localhost:5173
2. Enter a factual claim in the text field
3. Click "Verify Now"
4. View the results with supporting evidence

## Note

This repository includes pre-processed data, so you don't need to run any data processing scripts:
- `faiss_index.bin` and `doc_chunks.pkl` are located in the root directory
- Additional data is in the `data/wiki/` and `data/news/` folders
