from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Optional: Add headless or disable automation flags
options = Options()
options.add_argument("--start-maximized")  # or "--headless=new" for silent mode

# Use webdriver-manager to install the correct ChromeDriver version
driver_path = ChromeDriverManager().install()
print(f"ChromeDriver path detected by webdriver_manager: {driver_path}") # <--- ADD THIS LINE
service = Service(driver_path)

# Launch browser
driver = webdriver.Chrome(service=service, options=options)

# Test
driver.get("https://www.google.com")
print(driver.title)
driver.quit()