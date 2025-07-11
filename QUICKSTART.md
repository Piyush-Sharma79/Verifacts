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
# Navigate to the backend directory first
cd backend

# Create and activate a virtual environment inside the backend directory
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies from the requirements folder
pip install -r ../requirements/backend.txt

# IMPORTANT: Install the SpaCy language model
python -m spacy download en_core_web_sm

# Verify all packages are installed correctly
pip list

# IMPORTANT: Make sure the index files are in the correct location
# The app expects faiss_index.bin and doc_chunks.pkl in the root directory
# If you're in the backend directory, check if these files exist in the parent directory:
ls -la ..

# If the files are not found, copy them to the correct location:
# cp /path/to/original/faiss_index.bin ..
# cp /path/to/original/doc_chunks.pkl ..

# Start the server (make sure you're in the backend directory)
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

> **Troubleshooting Common Errors:**
>
> 1. **"Could not import module 'main'"**:
>    - Make sure you're in the `backend` directory when running uvicorn
>    - Use `uvicorn app.main:app --reload` (note the `app.` prefix)
>    - Check that main.py exists at `backend/app/main.py`
>
> 2. **SpaCy errors**:
>    - If you see errors about missing SpaCy models, run: `python -m spacy download en_core_web_sm`
>
> 3. **"could not open faiss_index.bin for reading: No such file or directory"**:
>    - This means the FAISS index file is not found in the expected location
>    - Check if `faiss_index.bin` exists in the root directory (parent of the backend directory)
>    - If not, copy it from the original project folder: `cp /path/to/original/faiss_index.bin ..`
>    - You may need to modify the path in `app/services.py` to point to the correct location
>
> 4. **Missing dependencies**:
>    - If you encounter other import errors, try installing the specific package: `pip install package-name`
>    - Then update the requirements file to include it for others

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

## File Path Configuration

If you're having issues with file paths, you might need to modify the paths in the code:

1. Check the file paths in `backend/app/services.py`:
```python
# Look for lines like these and update the paths if needed
INDEX_PATH = "../faiss_index.bin"  # Path to FAISS index
DOC_CHUNKS_PATH = "../doc_chunks.pkl"  # Path to document chunks
```

2. Update the paths to point to the correct location of your files.
