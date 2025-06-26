from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS for cross-origin requests
import os
import sys

# Add the directory containing your scraper to the Python path
# This assumes alibaba_scraper2.py is in the same directory as app.py
sys.path.append(os.path.dirname(__file__))

from alibaba_scraper import AlibabaSupplierScraper

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing your frontend to access it

# Initialize the scraper globally or within the request context
# It's better to initialize it once if it's stateless, or per request if stateful
# For simplicity, we'll initialize it once here.
# Consider using a queue or background tasks for long-running scraping jobs in production.
scraper = AlibabaSupplierScraper(headless=False) # Set to True for production, False for debugging

@app.route('/scrape', methods=['POST'])
def scrape_alibaba():
    """
    API endpoint to initiate the scraping process.
    Expects a JSON payload with 'keyword' and optional 'max_pages'.
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    keyword = data.get('keyword')
    max_pages = data.get('max_pages', 2) # Default to 2 pages if not provided

    if not keyword:
        return jsonify({"error": "Missing 'keyword' in request payload"}), 400

    app.logger.info(f"Received scrape request for keyword: '{keyword}', max_pages: {max_pages}")

    try:
        # Clear previous data before a new scrape
        scraper.suppliers_data = [] 
        scraper.search_suppliers(keyword, max_pages=max_pages)
        
        scraped_data = scraper.suppliers_data
        
        # You can choose to save to file here, or just return the data
        # For an API, returning the data directly is usually preferred.
        # If you need to save, consider making it an option in the request.

        app.logger.info(f"Scraped {len(scraped_data)} suppliers for '{keyword}'")
        return jsonify({"status": "success", "data": scraped_data}), 200

    except Exception as e:
        app.logger.exception(f"Error during scraping for keyword '{keyword}': {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # When running locally, ensure your Chrome driver is correctly set up
    # The scraper already handles ChromeDriverManager, but ensure it's functional.
    app.run(debug=True, port=5000) # Run in debug mode for development