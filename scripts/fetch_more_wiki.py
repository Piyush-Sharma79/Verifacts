import wikipediaapi
import os

# --- Configuration ---
# Extended list of topics to include in our knowledge base
WIKI_PAGES = [
    # Famous landmarks (existing)
    "Eiffel Tower", "Statue of Liberty", "Big Ben",

    # More landmarks
    "Taj Mahal", "Great Wall of China", "Pyramids of Giza", "Colosseum",
    "Machu Picchu", "Stonehenge", "Sydney Opera House", "Golden Gate Bridge",

    # Countries
    "United States", "India", "China", "Russia", "Brazil", "France", "Germany",
    "United Kingdom", "Japan", "Australia",

    # Science topics
    "Climate change", "Quantum physics", "Theory of relativity",
    "Solar System", "Black hole", "DNA", "Artificial intelligence",

    # Historical events
    "World War II", "Industrial Revolution", "French Revolution",
    "American Civil War", "Cold War", "Space Race",

    # Technology
    "Internet", "Smartphone", "Blockchain", "Renewable energy",
    "Electric vehicle", "Social media"
]

OUTPUT_DIR = "data/wiki"
USER_AGENT = "VeriFact Fact-Checker (Educational Project)"
# ---------------------

def fetch_and_save_wikipedia_articles():
    """
    Fetches specified Wikipedia articles and saves them to a directory.
    """
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    wiki_wiki = wikipediaapi.Wikipedia(
        language='en',
        user_agent=USER_AGENT
    )

    success_count = 0
    failure_count = 0

    for page_title in WIKI_PAGES:
        print(f"Fetching '{page_title}'...")
        page = wiki_wiki.page(page_title)

        if not page.exists():
            print(f"  > Page '{page_title}' does not exist. Skipping.")
            failure_count += 1
            continue

        file_path = os.path.join(OUTPUT_DIR, f"{page_title.replace(' ', '_')}.txt")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(page.text)
        print(f"  > Saved to '{file_path}'")
        success_count += 1

    print(f"\nFetching completed. Successfully downloaded {success_count} articles.")
    if failure_count > 0:
        print(f"Failed to download {failure_count} articles.")

if __name__ == "__main__":
    fetch_and_save_wikipedia_articles()
