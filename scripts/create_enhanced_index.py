import os
import glob
import faiss
import pickle
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from sentence_transformers import SentenceTransformer
from datetime import datetime

# --- Configuration ---
DATA_DIRS = ["data", "data/wiki", "data/news", "data/newstoday"]
INDEX_PATH = "faiss_index.bin"
DOC_CHUNKS_PATH = "doc_chunks.pkl"
MODEL_NAME = "BAAI/bge-small-en-v1.5"
# ---------------------

def create_enhanced_faiss_index():
    """
    Creates a FAISS index from documents in multiple data directories using
    SentenceTransformers and LangChain, including metadata about sources.
    """
    print(f"Starting enhanced index creation at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 1. Load documents from multiple directories
    documents = []

    for data_dir in DATA_DIRS:
        if not os.path.exists(data_dir):
            print(f"Directory '{data_dir}' does not exist. Skipping.")
            continue

        # Find all .txt files in the directory
        filepaths = glob.glob(os.path.join(data_dir, "**/*.txt"), recursive=True)

        print(f"Found {len(filepaths)} text files in '{data_dir}'")

        for file_path in filepaths:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract source information
                relative_path = os.path.relpath(file_path)
                filename = os.path.basename(file_path)
                source_type = "wikipedia" if "wiki" in file_path else "news" if "news" in file_path else "general"

                # Create a Document with metadata
                doc = Document(
                    page_content=content,
                    metadata={
                        "source": relative_path,
                        "filename": filename,
                        "source_type": source_type,
                        "created_at": datetime.now().isoformat()
                    }
                )

                documents.append(doc)
                print(f"  Added document: {relative_path}")
            except Exception as e:
                print(f"  Error reading {file_path}: {e}")

    if not documents:
        print(f"No documents found in any directory. Aborting.")
        return

    print(f"Loaded {len(documents)} documents in total.")

    # 2. Split documents into chunks with metadata preservation
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len,
        add_start_index=True,
    )

    doc_chunks = []
    for doc in documents:
        splits = text_splitter.split_documents([doc])
        doc_chunks.extend(splits)

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
    index.add(embeddings.cpu().numpy().astype('float32'))

    # 6. Save the index and chunks
    faiss.write_index(index, INDEX_PATH)
    with open(DOC_CHUNKS_PATH, "wb") as f:
        pickle.dump(doc_chunks, f)

    print(f"FAISS index saved to '{INDEX_PATH}'")
    print(f"Document chunks saved to '{DOC_CHUNKS_PATH}'")
    print(f"Index creation completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Print some statistics
    source_types = {}
    for chunk in doc_chunks:
        source_type = chunk.metadata.get('source_type', 'unknown')
        source_types[source_type] = source_types.get(source_type, 0) + 1

    print("\nIndex Statistics:")
    print(f"Total document chunks: {len(doc_chunks)}")
    print("Document chunks by source type:")
    for source_type, count in source_types.items():
        print(f"  - {source_type}: {count} chunks")


if __name__ == "__main__":
    create_enhanced_faiss_index()
