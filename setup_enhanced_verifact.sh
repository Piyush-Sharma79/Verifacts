#!/bin/bash

# VeriFact Enhanced Setup Script
# This script sets up the enhanced VeriFact system with expanded knowledge sources

echo "===== VeriFact Enhanced Setup ====="

# 1. Create necessary directories
echo "Creating directories..."
mkdir -p data/wiki data/news

# 2. Check for required Python packages
echo "Checking for required Python packages..."
pip install -r requirements/backend.txt
python -m spacy download en_core_web_sm

# 3. Setup environment variables
echo "Setting up environment..."
if [ ! -f .env ]; then
  cp env.template .env
  echo "Created .env file. Please edit it to add your NewsAPI key."
  echo "Press Enter to continue after editing the .env file..."
  read
fi

# 4. Fetch Wikipedia articles
echo "Fetching Wikipedia articles..."
python scripts/fetch_more_wiki.py

# 5. Fetch news articles (if API key is set)
echo "Fetching news articles..."
python scripts/fetch_news.py

# 6. Create the enhanced FAISS index
echo "Creating enhanced vector index..."
python scripts/create_enhanced_index.py

# 7. Start the backend server
echo "===== Setup Complete! ====="
echo "Starting the backend server..."
cd backend
uvicorn app.main:app --reload --port 8001 &
BACKEND_PID=$!

# 8. Start the frontend server
echo "Starting the frontend server..."
cd ../front
npm install
npm run dev &
FRONTEND_PID=$!

# 9. Show instructions
echo ""
echo "===== VeriFact is running! ====="
echo "Frontend: http://localhost:5173"
echo "Backend API: http://127.0.0.1:8001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle termination
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Wait for user to terminate
wait
