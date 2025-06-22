import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Optional: Add headless or disable automation flags
options = Options()
options.add_argument("--start-maximized")  # Maximizes the browser window
# options.add_argument("--headless=new") # Uncomment this line for silent mode (browser runs in background)

# Use webdriver-manager to install the correct ChromeDriver version.
# This method sometimes returns a path that includes non-executable files
# like 'THIRD_PARTY_NOTICES.chromedriver' on Windows.
raw_downloaded_path_from_wdm = ChromeDriverManager().install()

print(f"webdriver_manager initially returned path: {raw_downloaded_path_from_wdm}")

# --- IMPORTANT FIX FOR WINERROR 193 ---
# The path returned by webdriver_manager might point to a text file
# (e.g., 'THIRD_PARTY_NOTICES.chromedriver') instead of the actual executable.
# We need to extract the directory containing the 'chromedriver.exe' and then
# construct the correct path to the executable.

# 1. Get the directory name from the path returned by webdriver_manager.
# This will strip off any file name like 'THIRD_PARTY_NOTICES.chromedriver'.
# Example: "C:\...\chromedriver-win32/THIRD_PARTY_NOTICES.chromedriver"
# becomes "C:\...\chromedriver-win32"
base_directory_for_exe = os.path.dirname(raw_downloaded_path_from_wdm)

# 2. Construct the absolute path to 'chromedriver.exe' within that directory.
# This ensures we are pointing directly to the executable.
correct_chromedriver_path = os.path.join(base_directory_for_exe, "chromedriver.exe")

print(f"Corrected ChromeDriver path to be used: {correct_chromedriver_path}")
# --- END FIX ---


# Initialize the Chrome Service with the corrected path
service = Service(correct_chromedriver_path)

# Launch browser
try:
    driver = webdriver.Chrome(service=service, options=options)

    # Test: Navigate to Google and print the title
    driver.get("https://www.google.com")
    print(f"Browser title: {driver.title}")

except Exception as e:
    print(f"An error occurred while launching the browser: {e}")
finally:
    # Ensure the browser is closed even if an error occurs
    if 'driver' in locals() and driver:
        driver.quit()
        print("Browser closed.")

