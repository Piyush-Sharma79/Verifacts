import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# --- Configuration ---
OUTPUT_DIR = "data/news"
NEWS_API_KEY = os.getenv("NEWS_API_KEY")  # Set this in your .env file
TOPICS = ["technology", "science", "politics", "business", "health"]
DAYS_BACK = 2  # How many days of news to fetch
# ---------------------

def fetch_news_articles():
    """
    Fetches news articles from NewsAPI for specified topics
    and saves them as JSON files.
    """
    if not NEWS_API_KEY:
        print("Error: NEWS_API_KEY environment variable not set.")
        print("Please create a .env file with your NewsAPI key or set it in your environment.")
        return

    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_BACK)

    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')

    print(f"Fetching news articles from {start_date_str} to {end_date_str}...")

    total_articles = 0

    # Fetch articles for each topic
    for topic in TOPICS:
        print(f"Fetching articles for topic: {topic}")

        # NewsAPI endpoint for everything
        url = f"https://newsapi.org/v2/everything"
        params = {
            "q": topic,
            "from": start_date_str,
            "to": end_date_str,
            "sortBy": "relevancy",
            "language": "en",
            "pageSize": 20,  # Adjust as needed
            "apiKey": NEWS_API_KEY
        }

        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])

            if not articles:
                print(f"  No articles found for {topic}")
                continue

            print(f"  Found {len(articles)} articles")
            total_articles += len(articles)

            # Save to file
            today = datetime.now().strftime('%Y%m%d')
            file_path = os.path.join(OUTPUT_DIR, f"{topic}_{today}.json")

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)

            print(f"  Saved to {file_path}")

            # Also save individual article text files for easier processing
            for i, article in enumerate(articles):
                if article.get('content'):
                    # Extract title and content
                    title = article.get('title', 'No Title')
                    content = article.get('content', '')
                    source = article.get('source', {}).get('name', 'Unknown Source')
                    url = article.get('url', 'No URL')

                    # Create article text with metadata
                    article_text = f"TITLE: {title}\nSOURCE: {source}\nURL: {url}\n\n{content}"

                    # Save to individual text file
                    text_file_path = os.path.join(OUTPUT_DIR, f"{topic}_{today}_{i+1}.txt")
                    with open(text_file_path, 'w', encoding='utf-8') as f:
                        f.write(article_text)
        else:
            print(f"  Error fetching articles for {topic}: {response.status_code}")
            print(f"  Response: {response.text}")

    print(f"Fetching completed. Total articles: {total_articles}")

if __name__ == "__main__":
    fetch_news_articles()
