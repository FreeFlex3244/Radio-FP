from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Wait for radio grid to populate (JS execution)
        page.wait_for_selector(".radio-card")

        print(f"Title: {page.title()}")
        card_count = page.locator(".radio-card").count()
        print(f"Radio cards found: {card_count}")

        page.screenshot(path="refactor_verification.png")
        browser.close()

if __name__ == "__main__":
    run()
