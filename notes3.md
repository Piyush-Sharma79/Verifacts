Ran tool
# RAG and RAGatouille Explained: Understanding Our Fact-Checking Backend

## What is RAG?

**RAG (Retrieval-Augmented Generation)** is a technique that improves AI responses by combining:

1. **Retrieval**: Finding relevant documents or information from a knowledge base
2. **Generation**: Using that information to create accurate, informed responses

Think of RAG like this: When you ask a question, instead of the AI just "thinking" about the answer (which can lead to hallucinations), it:
1. First searches through a knowledge base for relevant information
2. Then uses that information to craft a reliable answer

### Why RAG Matters

Traditional LLMs (Large Language Models) like GPT-4 or our Qwen3 have limitations:
- They can't access real-time information
- Their knowledge is limited to their training data
- They can "hallucinate" or make up facts

RAG solves these problems by:
- Grounding AI responses in actual documents
- Enabling access to specialized or up-to-date knowledge
- Providing transparency through citations

## What is RAGatouille?

**RAGatouille** is a Python library that implements RAG pipelines with a focus on performance. It was mentioned in our original plans but wasn't ultimately used in our implementation due to compatibility issues.

Key features of RAGatouille:
- Built on top of advanced retrieval systems like ColBERT
- Offers pre-built pipelines for common RAG workflows
- Designed to work with LangChain
- Often faster than basic vector search methods

### The C++ Errors We Encountered

RAGatouille uses ColBERT, which requires C++ compilation. We encountered errors during setup, likely because:
1. ColBERT has specific system dependencies
2. It needs a C++ compiler properly configured
3. It may have compatibility issues with certain environments

## Our Custom RAG Implementation

Instead of using RAGatouille, we built our own RAG system using:

1. **FAISS** (Facebook AI Similarity Search): A highly efficient vector database library
2. **SentenceTransformers**: For creating text embeddings (converting text to vectors)
3. **LangChain**: For orchestrating the components and handling LLM communication

### Our RAG Pipeline Components:

1. **Document Processing**:
   - Load documents from text files
   - Split them into manageable chunks (512 characters with 50 character overlap)
   - Store these chunks in `doc_chunks.pkl`

2. **Vector Embedding**:
   - Use SentenceTransformers (`BAAI/bge-small-en-v1.5` model)
   - Convert each text chunk into a numerical vector that captures its meaning
   - Store these vectors in a FAISS index (`faiss_index.bin`)

3. **Retrieval Logic** (in `services.py`):
   ```python
   def retrieve_documents(query: str, k: int = 3) -> List[str]:
       # Generate embedding for the query
       query_embedding = EMBEDDING_MODEL.encode([query])[0].reshape(1, -1).astype('float32')
       # Search in the FAISS index
       D, I = INDEX.search(query_embedding, k)
       # Retrieve the corresponding documents
       results = []
       for i in I[0]:
           doc = DOC_CHUNKS[i]
           # Handle different document formats
           if hasattr(doc, 'page_content'):
               results.append(doc.page_content)
           elif isinstance(doc, dict) and 'content' in doc:
               results.append(doc['content'])
           else:
               results.append(str(doc))
       return results
   ```

4. **Generation** (also in `services.py`):
   ```python
   def generate_verdict(claim: str, evidence: List[str]) -> str:
       evidence_text = "\n\n".join(evidence)
       verdict = GENERATION_CHAIN.invoke({"claim": claim, "evidence": evidence_text})
       return verdict
   ```

## The RAG Theory Behind Our Implementation

### 1. Dense Vector Retrieval

We use "dense retrieval," where:
- Text is represented as dense vectors (hundreds of dimensions)
- Similarity is calculated using distance in this vector space
- Similar meanings have vectors that are close to each other

This is more powerful than keyword search because it captures semantic meaning. For example:
- "The Eiffel Tower's height" and "How tall is the Eiffel Tower" are semantically similar even though they share few words

### 2. Bi-Encoder Architecture

Our SentenceTransformer uses a bi-encoder approach:
- Documents and queries are encoded independently
- This allows us to pre-compute document embeddings
- Query embeddings can be computed on-the-fly
- Similarity is typically calculated using cosine similarity or L2 distance

### 3. Approximate Nearest Neighbor Search

FAISS uses sophisticated algorithms to make vector search extremely fast:
- Indexing structures (trees, hashing, quantization)
- Approximate search that trades a tiny bit of accuracy for enormous speed gains
- Can search through millions of vectors in milliseconds

### 4. Prompt Engineering for Evidence Integration

Our system carefully constructs prompts that:
- Present the claim clearly
- Include the retrieved evidence
- Ask the LLM to analyze the relationship between claim and evidence
- Request a structured verdict with explanation

## Advantages of Our Custom RAG Implementation

1. **Simplicity**: Our approach is easier to understand and maintain
2. **Control**: We have full control over each component
3. **Efficiency**: FAISS is extremely fast and memory-efficient
4. **Flexibility**: We can easily swap out components (like using a different embedding model)
5. **No C++ compilation issues**: Our stack is pure Python with pre-compiled binaries

## How This Compares to RAGatouille

While RAGatouille offers more advanced retrieval methods like ColBERT (which uses late interaction for more precise matching), our approach:

1. Is simpler to implement and maintain
2. Requires fewer dependencies
3. Works reliably across different environments
4. Still provides excellent results for our use case

The key difference is that RAGatouille might offer slightly better retrieval quality in complex cases, but our custom implementation is more than sufficient for our fact-checking application and avoids the C++ compilation issues we encountered.

Would you like me to elaborate on any specific aspect of our RAG implementation? Or would you like to see how we could potentially improve it in the future?
