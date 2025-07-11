import wikipediaapi
import os

# --- Configuration ---
WIKI_PAGES = ["Eiffel Tower", "Statue of Liberty", "Big Ben"]
OUTPUT_DIR = "data"
USER_AGENT = "VeriFact Hackathon (youremail@example.com)" # Be a good internet citizen
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

    for page_title in WIKI_PAGES:
        print(f"Fetching '{page_title}'...")
        page = wiki_wiki.page(page_title)

        if not page.exists():
            print(f"  > Page '{page_title}' does not exist. Skipping.")
            continue

        file_path = os.path.join(OUTPUT_DIR, f"{page_title.replace(' ', '_')}.txt")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(page.text)
        print(f"  > Saved to '{file_path}'")

if __name__ == "__main__":
    fetch_and_save_wikipedia_articles()
