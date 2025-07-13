import os
import glob
import re
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urlparse

# Function to extract URL from news files
def extract_url_from_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        url_match = re.search(r'URL: (https?://\S+)', content)
        if url_match:
            return url_match.group(1)
    return None

# Function to fetch full article content
def fetch_article_content(url):
    try:
        # Add user agent to avoid getting blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()

            # Extract text from the main content area - different for each site
            # This is a simplified approach - real-world implementation would need site-specific extractors
            article_text = ""

            # Try common article content containers
            content_candidates = [
                soup.find('article'),
                soup.find('div', class_=re.compile(r'(article|content|post)-?(body|text|main)')),
                soup.find('div', id=re.compile(r'(article|content|post)-?(body|text|main)')),
                soup.find('main')
            ]

            for candidate in content_candidates:
                if candidate and hasattr(candidate, 'find_all'):
                    paragraphs = candidate.find_all('p')
                    if paragraphs:
                        article_text = "\n".join([p.get_text().strip() for p in paragraphs])
                        break

            # If no specific container found, try getting all paragraphs
            if not article_text:
                paragraphs = soup.find_all('p')
                article_text = "\n".join([p.get_text().strip() for p in paragraphs])

            return article_text

        else:
            print(f"Failed to fetch content from {url}. Status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching content from {url}: {str(e)}")
        return None

# Function to update news file with full content
def update_news_file_with_content(file_path, full_content):
    with open(file_path, 'r', encoding='utf-8') as file:
        original_content = file.read()

    # Look for any truncated content markers
    if "[+6315 chars]" in original_content or "<ul><li>" in original_content:
        # Replace truncated content with full content
        updated_content = re.sub(r'<ul><li>.*?\[\+\d+ chars\]', full_content, original_content, flags=re.DOTALL)

        # If the pattern wasn't found, just append the content
        if updated_content == original_content:
            content_parts = original_content.split("\n\n", 3)  # Split after header info
            if len(content_parts) >= 3:
                updated_content = content_parts[0] + "\n\n" + content_parts[1] + "\n\n" + content_parts[2] + "\n\nFULL CONTENT:\n" + full_content
            else:
                updated_content = original_content + "\n\nFULL CONTENT:\n" + full_content
    else:
        # Just append the content
        updated_content = original_content + "\n\nFULL CONTENT:\n" + full_content

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

def main():
    # Find all news data files
    news_files = glob.glob("data/newstoday/*.txt")

    if not news_files:
        print("No news files found!")
        return

    print(f"Found {len(news_files)} news files")

    for i, file_path in enumerate(news_files):
        print(f"Processing file {i+1}/{len(news_files)}: {file_path}")

        # Extract URL from file
        url = extract_url_from_file(file_path)
        if not url:
            print(f"Could not find URL in file: {file_path}")
            continue

        print(f"Found URL: {url}")

        # Get domain name for logging
        domain = urlparse(url).netloc
        print(f"Fetching content from: {domain}")

        # Fetch full content
        full_content = fetch_article_content(url)
        if full_content:
            print(f"Successfully fetched content ({len(full_content)} characters)")
            # Update the file with full content
            update_news_file_with_content(file_path, full_content)
            print(f"Updated file: {file_path}")
        else:
            print(f"Failed to fetch content from {url}")

        # Be nice to the servers - add delay between requests
        if i < len(news_files) - 1:  # Don't sleep after the last request
            print("Waiting 2 seconds before next request...")
            time.sleep(2)

    print("Done processing all news files")

if __name__ == "__main__":
    main()
