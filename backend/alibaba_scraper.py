import time
import random
import json
import csv
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
import logging
from webdriver_manager.chrome import ChromeDriverManager

class AlibabaSupplierScraper:
    def __init__(self, headless=True):
        """Initialize the scraper with Chrome options"""
        self.setup_logging()
        self.driver = self.setup_driver(headless)
        self.suppliers_data = [] # This initializes the list to an empty state
        self.logger.debug(f"DEBUG: Initializing scraper. suppliers_data length: {len(self.suppliers_data)}")
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO, # Changed to INFO to see all debug messages by default
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        # Set level to DEBUG to see all custom debug messages
        self.logger.setLevel(logging.DEBUG) 
        
    def setup_driver(self, headless=True):
        """Setup Chrome driver with options to avoid detection"""
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument("--headless")
            
        # Anti-detection options
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Random user agent rotation
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        ]
        chrome_options.add_argument(f"--user-agent={random.choice(user_agents)}")
        
        # --- FIX START: Correcting ChromeDriver Path ---
        # Use webdriver-manager to install the correct ChromeDriver version.
        # However, it might return a path to a non-executable file (like a NOTICE file)
        # instead of the actual chromedriver.exe on Windows.
        raw_downloaded_path = ChromeDriverManager().install()
        self.logger.info(f"webdriver_manager initially returned path: {raw_downloaded_path}")

        # Correct the path:
        # 1. Use os.path.dirname() to get the directory part of the returned path.
        #    This effectively removes any trailing file name (like THIRD_PARTY_NOTICES.chromedriver).
        # 2. Use os.path.join() to combine this directory with the actual executable name "chromedriver.exe".
        #    This creates the correct, runnable path for the ChromeDriver executable.
        base_dir_for_exe = os.path.dirname(raw_downloaded_path)
        correct_chromedriver_path = os.path.join(base_dir_for_exe, "chromedriver.exe")
        self.logger.info(f"Using corrected ChromeDriver path: {correct_chromedriver_path}")

        # Setup driver service with the corrected path
        service = Service(correct_chromedriver_path)
        # --- FIX END ---
        
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Execute script to remove webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    
    def random_delay(self, min_seconds=1, max_seconds=3):
        """Add random delay to mimic human behavior"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)
        
    def search_suppliers(self, keyword, max_pages=3):
        """Search for suppliers based on keyword"""
        self.logger.debug(f"DEBUG: Starting search_suppliers. Current suppliers_data length: {len(self.suppliers_data)}")
        try:
            # Construct search URL
            search_url = f"https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText={keyword.replace(' ', '+')}"
            self.logger.info(f"Searching for: {keyword}")
            
            self.driver.get(search_url)
            self.random_delay(2, 4)
            
            # --- UPDATED: Wait for new product cards to load using a more robust selector ---
            # Wait for search results to load.
            # Using the `search-card-e-title` which is inside each product card for a more reliable wait.
            WebDriverWait(self.driver, 20).until( # Increased timeout
                EC.presence_of_element_located((By.CSS_SELECTOR, ".search-card-e-title a"))
            )
            self.logger.info("Search results page loaded.")
            # --- END UPDATED ---

            page_count = 0
            while page_count < max_pages:
                self.logger.info(f"Scraping page {page_count + 1}")
                
                # Scroll to load more content
                self.scroll_page()
                
                # Extract supplier data from current page
                suppliers = self.extract_supplier_data() # This extracts data from the current search results page
                self.suppliers_data.extend(suppliers)
                self.logger.info(f"Extracted {len(suppliers)} suppliers from page {page_count + 1}. Total in list: {len(self.suppliers_data)}")
                
                # Try to go to next page
                if not self.go_to_next_page():
                    self.logger.info(f"DEBUG: No next page found or navigation failed. Breaking loop.")
                    break
                    
                page_count += 1
                self.random_delay(3, 5) # Increased delay for pagination
                
        except TimeoutException:
            self.logger.error("Timeout waiting for search results to load (check internet or selectors).")
        except Exception as e:
            self.logger.error(f"Error during search: {str(e)}", exc_info=True) # exc_info=True to print full traceback
            
        self.logger.debug(f"DEBUG: Exiting search_suppliers. Final suppliers_data length: {len(self.suppliers_data)}")

    def scroll_page(self, scroll_attempts=2):
        """Scroll page to load dynamic content"""
        # Scroll in increments to trigger more lazy loading
        self.logger.info("Scrolling page to load more content...")
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        for _ in range(scroll_attempts):
            self.driver.execute_script("window.scrollBy(0, window.innerHeight * 0.8);")
            self.random_delay(1, 2)
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height: # If no new content loaded, break
                self.logger.info("Reached end of scrollable content or no more lazy loaded items.")
                break
            last_height = new_height

        # Final scroll to bottom
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.random_delay(1, 2)
        
    def extract_supplier_data(self):
        """
        Extracts supplier information from search results page (product cards).
        This version extracts all visible data from the search result card itself.
        """
        suppliers = []
        
        try:
            # --- PRIMARY SELECTOR FOR INDIVIDUAL PRODUCT CARDS ---
            # Based on the new HTML (alibabaHTML2.txt), the most reliable selector is:
            # `.fy23-search-card.searchx-offer-item`
            product_cards = self.driver.find_elements(By.CSS_SELECTOR, ".fy23-search-card.searchx-offer-item")
            
            if not product_cards:
                self.logger.warning("No product cards found with '.fy23-search-card.searchx-offer-item'. Trying old selectors as fallback.")
                product_cards = self.driver.find_elements(By.CSS_SELECTOR, ".organic-offer-wrapper .organic-offer-item")
            
            if not product_cards:
                self.logger.warning("Still no product cards found after trying all known selectors on this search page.")
                
            for card in product_cards:
                try:
                    # Added a check for StaleElementReferenceException which can occur during scrolling/lazy loading
                    supplier_info = self.extract_card_info(card)
                    if supplier_info:
                        suppliers.append(supplier_info)
                        self.random_delay(0.5, 1)
                except StaleElementReferenceException:
                    self.logger.warning("StaleElementReferenceException encountered. Skipping this card.")
                    continue
                except Exception as e:
                    self.logger.warning(f"Error extracting individual card info (possible selector issue within card): {str(e)}", exc_info=True)
                    continue
                    
        except NoSuchElementException:
            self.logger.warning("No main product cards container found with current selectors on search page.")
            
        return suppliers
    
    def extract_card_info(self, card):
        """Extract information from individual supplier card on search results page"""
        supplier_info = {}
        
        try:
            # Product title/name and URL
            # UPDATED SELECTOR: Targeting the 'a' tag within 'h2.search-card-e-title'
            try:
                title_element = card.find_element(By.CSS_SELECTOR, "h2.search-card-e-title a span") # Get the span text
                supplier_info['product_title'] = title_element.text.strip()
                supplier_info['product_url'] = title_element.find_element(By.XPATH, "./ancestor::a").get_attribute('href') # Get URL from parent <a>
            except NoSuchElementException:
                supplier_info['product_title'] = "N/A"
                supplier_info['product_url'] = "N/A"
            
            # Price information
            # UPDATED SELECTOR: Targeting the 'search-card-e-price-main' class
            try:
                price_element = card.find_element(By.CSS_SELECTOR, ".search-card-e-price-main")
                supplier_info['price'] = price_element.text.strip()
            except NoSuchElementException:
                supplier_info['price'] = "N/A"
            
            # Supplier company name and URL
            # UPDATED SELECTOR: Targeting 'a.search-card-e-company'
            try:
                company_element = card.find_element(By.CSS_SELECTOR, "a.search-card-e-company")
                supplier_info['company_name'] = company_element.text.strip()
                supplier_info['company_url'] = company_element.get_attribute('href')
            except NoSuchElementException:
                supplier_info['company_name'] = "N/A"
                supplier_info['company_url'] = "N/A"
            
            # Location
            # Based on alibabaHTML2.txt, this is usually a span following the year, e.g., "CN Supplier"
            try:
                location_element = card.find_element(By.CSS_SELECTOR, ".search-card-e-supplier__year span:last-of-type")
                full_location_text = location_element.text.strip()
                
                # --- NEW: Split location text into years and supplier location ---
                # Example: "11 yrs\nCN Supplier" or "10 yrs\nES Supplier"
                location_parts = full_location_text.split('\n')
                if len(location_parts) == 2:
                    supplier_info['years_on_alibaba_search_page'] = location_parts[0].strip()
                    supplier_info['location_search_page'] = location_parts[1].strip()
                else:
                    # Fallback if format is unexpected
                    supplier_info['years_on_alibaba_search_page'] = "N/A"
                    supplier_info['location_search_page'] = full_location_text
                # --- END NEW ---

                # Old 'location' field can be removed or kept for raw text if desired.
                # For clarity, let's keep the split values.
                # supplier_info['location'] = full_location_text # Original combined field (optional)

            except NoSuchElementException:
                supplier_info['years_on_alibaba_search_page'] = "N/A"
                supplier_info['location_search_page'] = "N/A"
            except Exception as e:
                self.logger.warning(f"Error parsing location/years on search page: {e}")
                supplier_info['years_on_alibaba_search_page'] = "N/A"
                supplier_info['location_search_page'] = "N/A"
            
            # Minimum order quantity
            # UPDATED SELECTOR: Targeting 'search-card-m-sale-features__item'
            try:
                moq_element = card.find_element(By.CSS_SELECTOR, ".search-card-m-sale-features__item")
                supplier_info['min_order'] = moq_element.text.strip()
            except NoSuchElementException:
                supplier_info['min_order'] = "N/A"
            
            # Supplier verification/certifications
            supplier_info['certifications'] = []
            try:
                # Cert images usually have alt text
                cert_img_elements = card.find_elements(By.CSS_SELECTOR, ".search-card-e-icon__certification-wrapper img")
                for cert_img in cert_img_elements:
                    alt_text = cert_img.get_attribute('alt')
                    if alt_text and alt_text.strip() and alt_text.strip() not in supplier_info['certifications']:
                        supplier_info['certifications'].append(alt_text.strip())
                
                # Check for "certified" text if it's a standalone element
                certified_text_elements = card.find_elements(By.CSS_SELECTOR, ".enhance-certs___certification-wrapper.certified")
                if certified_text_elements:
                    for element in certified_text_elements:
                        text_content = element.text.strip()
                        if text_content and text_content not in supplier_info['certifications']:
                            supplier_info['certifications'].append(text_content)
                
                # Check for "Verified Supplier" indicator
                verified_elements = card.find_elements(By.XPATH, ".//a[contains(@class, 'verified-supplier-icon__wrapper')]//img[contains(@class, 'verified-supplier-icon')]")
                if verified_elements and "Verified Supplier" not in supplier_info['certifications']:
                    supplier_info['certifications'].append("Verified Supplier")

            except NoSuchElementException:
                pass # No certifications found is normal
            
            # Response rate/time
            # UPDATED SELECTOR: Targeting 'search-card-e-review'
            try:
                # The review element often contains "X.X/5.0 (Y reviews)"
                response_element = card.find_element(By.CSS_SELECTOR, ".search-card-e-review")
                supplier_info['response_rate'] = response_element.text.strip()
            except NoSuchElementException:
                supplier_info['response_rate'] = "N/A"
                
            return supplier_info
            
        except Exception as e:
            self.logger.warning(f"Error extracting individual card: {str(e)}", exc_info=True)
            return None
    
    def go_to_next_page(self):
        """Navigate to next page if available"""
        try:
            # Wait for pagination to be present
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".next-pagination-item"))
            )
            
            next_button = None
            try:
                # Find by text content "Next" (case-insensitive and partial match)
                next_button = self.driver.find_element(By.XPATH, "//li[contains(@class, 'next-pagination-item') and not(contains(@class, 'disabled')) and (.//span[contains(text(), 'Next')] or .//i[contains(@class, 'next-icon-arrow-right')])]")
            except NoSuchElementException:
                # Fallback: Find all pagination items and assume the last non-disabled one is 'Next'.
                pagination_items = self.driver.find_elements(By.CSS_SELECTOR, ".next-pagination-item")
                if pagination_items:
                    for item in reversed(pagination_items): # Check from the end
                        # Ensure the item itself is clickable and not disabled
                        if "disabled" not in item.get_attribute("class", default=""):
                            # Check if the item contains a clickable anchor or button
                            try:
                                clickable_child = item.find_element(By.CSS_SELECTOR, "a, button")
                                next_button = clickable_child
                                break
                            except NoSuchElementException:
                                # If no specific clickable child, try the li itself (less robust)
                                next_button = item 
                                break

            if next_button:
                WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable(next_button))
                self.driver.execute_script("arguments[0].click();", next_button) # Use JS click for robustness
                self.random_delay(2, 4)
                self.logger.info("Navigated to the next page.")
                return True
            else:
                self.logger.info("No next page button found or it is disabled.")
                return False
        except TimeoutException:
            self.logger.warning("Timeout waiting for pagination elements. Likely end of pages or page structure changed.")
            return False
        except NoSuchElementException:
            self.logger.warning("Next page button not found using XPATH or CSS selectors. Likely end of pages or pagination structure changed.")
            return False
        except Exception as e:
            self.logger.error(f"Error navigating to next page: {str(e)}", exc_info=True)
            return False
    
    def save_to_json(self, filename):
        """Save scraped data to JSON file"""
        self.logger.debug(f"DEBUG: Saving to JSON. suppliers_data length: {len(self.suppliers_data)}")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.suppliers_data, f, ensure_ascii=False, indent=2)
        self.logger.info(f"Data saved to {filename}")
    
    def save_to_csv(self, filename):
        """Save scraped data to CSV file"""
        self.logger.debug(f"DEBUG: Saving to CSV. suppliers_data length: {len(self.suppliers_data)}")
        if not self.suppliers_data:
            self.logger.warning("No data to save")
            return
            
        # Dynamically collect all possible keys from all scraped dictionaries
        all_keys = set()
        for item in self.suppliers_data:
            all_keys.update(item.keys())
        
        # Sort keys for consistent CSV header order (optional but good practice)
        fieldnames = sorted(list(all_keys)) 
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in self.suppliers_data:
                # Create a clean row copy to handle complex fields and missing keys
                cleaned_row = {}
                for key in fieldnames:
                    value = row.get(key)
                    if isinstance(value, (list, dict)):
                        # For lists and dictionaries, convert to JSON string
                        cleaned_row[key] = json.dumps(value, ensure_ascii=False)
                    else:
                        # For other types, use the value directly (or default to empty string if None)
                        cleaned_row[key] = value if value is not None else ""
                writer.writerow(cleaned_row)
        
        self.logger.info(f"Data saved to {filename}")
    
    def get_supplier_count(self):
        """Get number of scraped suppliers"""
        count = len(self.suppliers_data)
        self.logger.debug(f"DEBUG: get_supplier_count called. Returning: {count}")
        return count
    
    def close(self):
        """Close the browser driver"""
        if self.driver: # Check if driver exists before quitting
            self.driver.quit()
            self.logger.info("Browser driver closed.")
        else:
            self.logger.info("Browser driver was not initialized or already closed.")

# Usage example
def main():
    """Main function to demonstrate scraper usage"""
    scraper = AlibabaSupplierScraper(headless=False) # Keep False for debugging
    
    try:
        # Search for suppliers
        search_keyword = "corn grain"
        scraper.search_suppliers(search_keyword, max_pages=2) # Adjust max_pages as needed
        
        # Print results summary
        print(f"\n--- Scrape Summary ---")
        # Added debug logging here to confirm suppliers_data content just before printing summary
        scraper.logger.debug(f"DEBUG: main() - Before getting supplier count. suppliers_data length: {len(scraper.suppliers_data)}")
        print(f"Found {scraper.get_supplier_count()} suppliers for '{search_keyword}'")
        
        # Save results
        json_filename = f"{search_keyword.replace(' ', '_')}_suppliers.json"
        csv_filename = f"{search_keyword.replace(' ', '_')}_suppliers.csv"
        scraper.save_to_json(json_filename)
        scraper.save_to_csv(csv_filename)
        
        # Print first few results (if available)
        if scraper.suppliers_data:
            print("\nFirst supplier found (example data):")
            # Using json.dumps to pretty print the entire dictionary for inspection
            print(json.dumps(scraper.suppliers_data[0], indent=2, ensure_ascii=False))
        else:
            print("No suppliers data was scraped.")
                
    except Exception as e:
        scraper.logger.exception(f"An unhandled error occurred in main: {e}") # Use exception for full traceback
    finally:
        scraper.close()

# if __name__ == "__main__":
#     main()
