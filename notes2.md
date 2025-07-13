Ran tool
Ran tool
Ran tool
Read file: scripts/create_index.py
Read file: scripts/fetch_data.py
Read file: data/Eiffel_Tower.txt
# Understanding VeriFact: A Simple Explanation of Our Fact-Checking System

Let me explain how VeriFact works from the ground up, focusing on the key concepts like document chunks and vector search:

## 1. What is VeriFact?

VeriFact is our AI fact-checker that verifies claims by:
- Taking a user's statement (like "The Eiffel Tower is 330 meters tall")
- Finding relevant information in our knowledge base
- Providing a verdict (Supported, Refuted, or Not Enough Information)

## 2. The Data Sources

Right now, we're using just three text files as our knowledge source:
- Eiffel_Tower.txt
- Statue_of_Liberty.txt
- Big_Ben.txt

These are Wikipedia articles we downloaded using the `fetch_data.py` script. This is why the system gets confused with facts unrelated to these three landmarks - our knowledge base is currently limited to just these topics!

## 3. Document Chunks: What Are They?

Think of a document chunk like a small piece of a bigger text. Imagine you have a long book - reading the whole book to find one fact would take too long. Instead, we break it into small, manageable chunks.

Our `doc_chunks.pkl` file is a pickle file (Python's way of saving objects) that contains these text chunks. Here's how we created them:

1. We took our Wikipedia articles
2. Cut them into smaller pieces (512 characters each with 50 character overlap)
3. Saved these pieces in the pickle file

Each chunk is small enough to be:
- Easy to search through
- Specific enough to contain related information
- The right size for our AI to process

## 4. FAISS Index: Making Search Super Fast

Now imagine you have hundreds or thousands of these chunks. How do you quickly find which ones contain information about "the height of the Eiffel Tower"?

This is where FAISS (Facebook AI Similarity Search) and vector embeddings come in:

### What are Vector Embeddings?

Think of words and sentences as having "meaning coordinates" in space:
- Words with similar meanings are close to each other
- Different concepts are far apart

When we say "convert text to vectors," we're using AI to map text into numbers that capture meaning. For example:
- "The Eiffel Tower is tall" might become [0.2, -0.5, 0.8, ...]
- "The Statue of Liberty is green" might become [-0.7, 0.1, 0.3, ...]

We use the SentenceTransformer model (`BAAI/bge-small-en-v1.5`) to create these vectors.

### How FAISS Works:

1. We convert every document chunk into a vector (list of numbers)
2. FAISS organizes these vectors for super-fast searching
3. The `faiss_index.bin` file stores this organized collection

Think of FAISS like a librarian who organizes books so well that they can instantly find any book on any topic without checking each shelf.

## 5. Step-by-Step Flow of Our Fact-Checking System:

### Step 1: User Submits a Claim
"The Eiffel Tower is 330 meters tall"

### Step 2: Claim Extraction
Our `extract_claims` function uses spaCy (a natural language processing library) to identify the main factual statement.

### Step 3: Vector Search
1. We convert the claim into a vector using SentenceTransformer
2. We use FAISS to find the most similar document chunks in our knowledge base
3. This is like asking "which pieces of our Wikipedia articles talk about something similar to this claim?"

### Step 4: LLM Verification
1. We send the claim and the retrieved document chunks to our Ollama LLM (Qwen3:8b)
2. The LLM compares the claim against the evidence
3. It generates a verdict with explanation

### Step 5: Display Results
The frontend shows:
- The original claim
- The verdict (Supported/Refuted/Not Enough Information)
- The evidence used

## 6. Creating the Index (How We Made doc_chunks.pkl and faiss_index.bin)

The `create_index.py` script does several things:

1. Loads the Wikipedia text files from the `data` directory
2. Splits them into chunks using `RecursiveCharacterTextSplitter`
3. Creates embeddings for each chunk using `SentenceTransformer`
4. Builds a FAISS index with these embeddings
5. Saves both the chunks and index to files:
   - `doc_chunks.pkl` - The actual text pieces
   - `faiss_index.bin` - The searchable vector database

To expand our knowledge base, we would:
1. Add more text files to the `data` folder
2. Run `create_index.py` again to rebuild our index
3. Now the system would know about these new topics!

## 7. Why This Approach is Powerful

1. **Accuracy**: We're not just making things up - we're checking against real information
2. **Transparency**: We show exactly what evidence we used
3. **Scalability**: We can add more knowledge by simply adding more text files
4. **Speed**: Vector search finds relevant information almost instantly

The combination of:
- Document chunking (breaking text into pieces)
- Vector embeddings (converting text to numbers that capture meaning)
- FAISS indexing (organizing vectors for fast search)
- LLM reasoning (analyzing the evidence)

Creates a powerful system that can verify facts with evidence rather than just hallucinating answers.

Does this explanation help you understand how our system works and specifically what those files are for? Let me know if you want me to clarify anything else!
