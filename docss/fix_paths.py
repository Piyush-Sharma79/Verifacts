#!/usr/bin/env python3
"""
Script to fix file paths in the services.py file.
This script will update the paths to point to the correct location of the index files.
"""

import os
import sys
import re

def fix_paths():
    # Find the services.py file
    services_file = None
    for root, dirs, files in os.walk('backend'):
        if 'services.py' in files:
            services_file = os.path.join(root, 'services.py')
            break

    if not services_file:
        print("Error: services.py file not found in the backend directory.")
        return False

    print(f"Found services.py at: {services_file}")

    # Read the file content
    with open(services_file, 'r') as f:
        content = f.read()

    # Check if the paths are already correct
    if '../faiss_index.bin' in content and '../doc_chunks.pkl' in content:
        print("Paths are already correctly set to relative paths.")
        return True

    # Update the paths
    updated_content = re.sub(
        r'INDEX_PATH\s*=\s*["\']faiss_index\.bin["\']',
        'INDEX_PATH = "../faiss_index.bin"',
        content
    )

    updated_content = re.sub(
        r'DOC_CHUNKS_PATH\s*=\s*["\']doc_chunks\.pkl["\']',
        'DOC_CHUNKS_PATH = "../doc_chunks.pkl"',
        updated_content
    )

    # Write the updated content back to the file
    with open(services_file, 'w') as f:
        f.write(updated_content)

    print("Updated paths in services.py:")
    print("  - INDEX_PATH = \"../faiss_index.bin\"")
    print("  - DOC_CHUNKS_PATH = \"../doc_chunks.pkl\"")

    # Check if the files exist in the root directory
    root_dir = os.path.dirname(os.path.dirname(services_file))
    faiss_index_path = os.path.join(root_dir, 'faiss_index.bin')
    doc_chunks_path = os.path.join(root_dir, 'doc_chunks.pkl')

    if not os.path.exists(faiss_index_path):
        print(f"Warning: faiss_index.bin not found at {faiss_index_path}")
        print("Make sure to copy the file to this location.")
    else:
        print(f"Found faiss_index.bin at {faiss_index_path}")

    if not os.path.exists(doc_chunks_path):
        print(f"Warning: doc_chunks.pkl not found at {doc_chunks_path}")
        print("Make sure to copy the file to this location.")
    else:
        print(f"Found doc_chunks.pkl at {doc_chunks_path}")

    return True

if __name__ == "__main__":
    print("VeriFact Path Fixer")
    print("===================")

    if fix_paths():
        print("\nPath fixing completed successfully.")
        print("You can now start the server with: uvicorn app.main:app --reload")
    else:
        print("\nFailed to fix paths. Please check the error messages above.")
        sys.exit(1)
