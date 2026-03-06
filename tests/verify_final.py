from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800}) # Desktop size to see layout
        page.goto("http://localhost:8080")

        # Wait for radio grid
        page.wait_for_selector(".radio-card")

        # Wait a bit for background animation to start (visual check only)
        page.wait_for_timeout(1000)

        print(f"Title: {page.title()}")

        # Capture screenshot
        page.screenshot(path="final_verification.png")

        # Also capture mobile view
        page.set_viewport_size({"width": 375, "height": 812})
        page.screenshot(path="final_verification_mobile.png")

        browser.close()

if __name__ == "__main__":
    run()
