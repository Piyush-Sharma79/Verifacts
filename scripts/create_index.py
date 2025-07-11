import os
import faiss
import pickle
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# --- Configuration ---
DATA_DIR = "data"
INDEX_PATH = "faiss_index.bin"
DOC_CHUNKS_PATH = "doc_chunks.pkl"
MODEL_NAME = "BAAI/bge-small-en-v1.5"
# ---------------------

def create_faiss_index():
    """
    Creates a FAISS index from documents in the data directory using
    SentenceTransformers and LangChain.
    """
    if os.path.exists(INDEX_PATH) and os.path.exists(DOC_CHUNKS_PATH):
        print(f"Index and document chunks already exist. Skipping creation.")
        return

    # 1. Load documents
    documents = []
    filepaths = [os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR) if f.endswith('.txt')]
    for file_path in filepaths:
        with open(file_path, 'r', encoding='utf-8') as f:
            documents.append(f.read())

    if not documents:
        print(f"No .txt files found in '{DATA_DIR}'. Aborting.")
        return

    print(f"Loaded {len(documents)} documents.")

    # 2. Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len
    )
    doc_chunks = text_splitter.create_documents(documents)
    print(f"Split documents into {len(doc_chunks)} chunks.")

    # 3. Load embedding model
    print(f"Loading embedding model '{MODEL_NAME}'...")
    embedding_model = SentenceTransformer(MODEL_NAME)

    # 4. Generate embeddings
    print("Generating embeddings for document chunks...")
    chunk_texts = [chunk.page_content for chunk in doc_chunks]
    embeddings = embedding_model.encode(chunk_texts, convert_to_tensor=True, show_progress_bar=True)

    # 5. Create FAISS index
    print("Creating FAISS index...")
    embedding_dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(embeddings.cpu().numpy())

    # 6. Save the index and chunks
    faiss.write_index(index, INDEX_PATH)
    with open(DOC_CHUNKS_PATH, "wb") as f:
        pickle.dump(doc_chunks, f)

    print(f"FAISS index saved to '{INDEX_PATH}'")
    print(f"Document chunks saved to '{DOC_CHUNKS_PATH}'")


if __name__ == "__main__":
    create_faiss_index()
