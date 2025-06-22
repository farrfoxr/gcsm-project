import time
import random
import json
import csv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import logging

class AlibabaSupplierScraper:
    def __init__(self, headless=True):
        """Initialize the scraper with Chrome options"""
        self.setup_logging()
        self.driver = self.setup_driver(headless)
        self.suppliers_data = []
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
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
        
        # Setup driver
        service = Service(ChromeDriverManager().install())
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
        try:
            # Construct search URL
            search_url = f"https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText={keyword.replace(' ', '+')}"
            self.logger.info(f"Searching for: {keyword}")
            
            self.driver.get(search_url)
            self.random_delay(2, 4)
            
            # Wait for search results to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "organic-list"))
            )
            
            page_count = 0
            while page_count < max_pages:
                self.logger.info(f"Scraping page {page_count + 1}")
                
                # Scroll to load more content
                self.scroll_page()
                
                # Extract supplier data from current page
                suppliers = self.extract_supplier_data()
                self.suppliers_data.extend(suppliers)
                
                # Try to go to next page
                if not self.go_to_next_page():
                    break
                    
                page_count += 1
                self.random_delay(3, 5)
                
        except TimeoutException:
            self.logger.error("Timeout waiting for search results to load")
        except Exception as e:
            self.logger.error(f"Error during search: {str(e)}")
            
    def scroll_page(self):
        """Scroll page to load dynamic content"""
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        self.random_delay(1, 2)
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.random_delay(1, 2)
        
    def extract_supplier_data(self):
        """Extract supplier information from search results"""
        suppliers = []
        
        try:
            # Find all product cards
            product_cards = self.driver.find_elements(By.CSS_SELECTOR, ".organic-list .list-item")
            
            for card in product_cards:
                try:
                    supplier_info = self.extract_card_info(card)
                    if supplier_info:
                        suppliers.append(supplier_info)
                        self.random_delay(0.5, 1)
                except Exception as e:
                    self.logger.warning(f"Error extracting card info: {str(e)}")
                    continue
                    
        except NoSuchElementException:
            self.logger.warning("No product cards found on this page")
            
        return suppliers
    
    def extract_card_info(self, card):
        """Extract information from individual supplier card"""
        supplier_info = {}
        
        try:
            # Product title/name
            try:
                title_element = card.find_element(By.CSS_SELECTOR, ".item-title a")
                supplier_info['product_title'] = title_element.text.strip()
                supplier_info['product_url'] = title_element.get_attribute('href')
            except NoSuchElementException:
                supplier_info['product_title'] = "N/A"
                supplier_info['product_url'] = "N/A"
            
            # Price information
            try:
                price_element = card.find_element(By.CSS_SELECTOR, ".price")
                supplier_info['price'] = price_element.text.strip()
            except NoSuchElementException:
                supplier_info['price'] = "N/A"
            
            # Supplier company name
            try:
                company_element = card.find_element(By.CSS_SELECTOR, ".supplier a")
                supplier_info['company_name'] = company_element.text.strip()
                supplier_info['company_url'] = company_element.get_attribute('href')
            except NoSuchElementException:
                supplier_info['company_name'] = "N/A"
                supplier_info['company_url'] = "N/A"
            
            # Location
            try:
                location_element = card.find_element(By.CSS_SELECTOR, ".supplier-location")
                supplier_info['location'] = location_element.text.strip()
            except NoSuchElementException:
                supplier_info['location'] = "N/A"
            
            # Minimum order quantity
            try:
                moq_element = card.find_element(By.CSS_SELECTOR, ".moq")
                supplier_info['min_order'] = moq_element.text.strip()
            except NoSuchElementException:
                supplier_info['min_order'] = "N/A"
            
            # Product description (if available)
            try:
                desc_element = card.find_element(By.CSS_SELECTOR, ".item-desc")
                supplier_info['description'] = desc_element.text.strip()
            except NoSuchElementException:
                supplier_info['description'] = "N/A"
            
            # Supplier verification/certifications
            supplier_info['certifications'] = []
            try:
                cert_elements = card.find_elements(By.CSS_SELECTOR, ".supplier-tag")
                for cert in cert_elements:
                    supplier_info['certifications'].append(cert.text.strip())
            except NoSuchElementException:
                pass
            
            # Response rate/time (if available)
            try:
                response_element = card.find_element(By.CSS_SELECTOR, ".response-rate")
                supplier_info['response_rate'] = response_element.text.strip()
            except NoSuchElementException:
                supplier_info['response_rate'] = "N/A"
                
            return supplier_info
            
        except Exception as e:
            self.logger.warning(f"Error extracting individual card: {str(e)}")
            return None
    
    def go_to_next_page(self):
        """Navigate to next page if available"""
        try:
            next_button = self.driver.find_element(By.CSS_SELECTOR, ".next-pagination-item")
            if "disabled" not in next_button.get_attribute("class"):
                next_button.click()
                self.random_delay(2, 4)
                return True
            else:
                return False
        except NoSuchElementException:
            return False
    
    def save_to_json(self, filename):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.suppliers_data, f, ensure_ascii=False, indent=2)
        self.logger.info(f"Data saved to {filename}")
    
    def save_to_csv(self, filename):
        """Save scraped data to CSV file"""
        if not self.suppliers_data:
            self.logger.warning("No data to save")
            return
            
        fieldnames = self.suppliers_data[0].keys()
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in self.suppliers_data:
                # Convert list fields to string for CSV
                row_copy = row.copy()
                if 'certifications' in row_copy:
                    row_copy['certifications'] = ', '.join(row_copy['certifications'])
                writer.writerow(row_copy)
        
        self.logger.info(f"Data saved to {filename}")
    
    def get_supplier_count(self):
        """Get number of scraped suppliers"""
        return len(self.suppliers_data)
    
    def close(self):
        """Close the browser driver"""
        self.driver.quit()

# Usage example
def main():
    """Main function to demonstrate scraper usage"""
    scraper = AlibabaSupplierScraper(headless=True)
    
    try:
        # Search for suppliers
        search_keyword = "corn grain"
        scraper.search_suppliers(search_keyword, max_pages=2)
        
        # Print results summary
        print(f"Found {scraper.get_supplier_count()} suppliers")
        
        # Save results
        scraper.save_to_json(f"{search_keyword.replace(' ', '_')}_suppliers.json")
        scraper.save_to_csv(f"{search_keyword.replace(' ', '_')}_suppliers.csv")
        
        # Print first few results
        if scraper.suppliers_data:
            print("\nFirst supplier found:")
            for key, value in list(scraper.suppliers_data[0].items()):
                print(f"{key}: {value}")
                
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        scraper.close()

if __name__ == "__main__":
    main()