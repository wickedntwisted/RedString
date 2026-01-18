#!/usr/bin/env python3
"""
Helper script to create LinkedIn session file with credentials.
Run this once to authenticate with LinkedIn.
"""

import asyncio
from linkedin_scraper import BrowserManager

async def setup_session():
    email = "bytebabysearch@gmail.com"
    password = "CZS11ninpTn9uP"

    print("Setting up LinkedIn session...")
    print(f"Email: {email}")

    async with BrowserManager(headless=False) as browser:
        print("Browser opened. Navigating to LinkedIn login...")

        # Navigate to LinkedIn login
        await browser.page.goto("https://www.linkedin.com/login")

        # Fill in credentials
        await browser.page.fill('input[name="session_key"]', email)
        await browser.page.fill('input[name="session_password"]', password)

        print("Credentials entered. Clicking sign in...")
        await browser.page.click('button[type="submit"]')

        # Wait for login to complete
        print("Waiting for login to complete...")
        await browser.page.wait_for_url("https://www.linkedin.com/feed/*", timeout=30000)

        print("Login successful! Saving session...")

        # Save the session
        await browser.save_session("playwright/session.json")

        print("✓ Session saved to playwright/session.json")
        print("✓ You can now use the LinkedIn scraper!")

if __name__ == "__main__":
    asyncio.run(setup_session())
