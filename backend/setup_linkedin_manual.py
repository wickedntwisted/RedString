#!/usr/bin/env python3
"""
Manual LinkedIn session setup - keeps browser open for you to login.
Complete any CAPTCHA or verification, then press Enter here.
"""

import asyncio
from linkedin_scraper import BrowserManager

async def manual_setup():
    email = "bytebabysearch@gmail.com"
    password = "CZS11ninpTn9uP"

    print("=== LinkedIn Session Setup ===")
    print(f"Email: {email}")
    print("\nBrowser will open. Steps:")
    print("1. A browser window will open to LinkedIn login")
    print("2. Complete any CAPTCHA or verification if needed")
    print("3. Wait until you see your LinkedIn feed")
    print("4. Come back here and press Enter")
    print("\n" + "="*50 + "\n")

    async with BrowserManager(headless=False) as browser:
        # Navigate to LinkedIn login
        await browser.page.goto("https://www.linkedin.com/login")

        # Fill in credentials
        await browser.page.fill('input[name="session_key"]', email)
        await browser.page.fill('input[name="session_password"]', password)

        print("✓ Credentials filled")
        print("✓ Clicking sign in button...")
        await browser.page.click('button[type="submit"]')

        # Wait for manual intervention
        print("\n⏳ Waiting for you to complete login...")
        print("   (Complete CAPTCHA if shown, then press Enter here)")
        input("\n>>> Press Enter once you're logged in and see your feed: ")

        print("\n💾 Saving session...")
        await browser.save_session("playwright/session.json")

        print("\n✓ SUCCESS! Session saved to playwright/session.json")
        print("✓ You can now close the browser")
        print("✓ The LinkedIn scraper will use this session\n")

if __name__ == "__main__":
    asyncio.run(manual_setup())
