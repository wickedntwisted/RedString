import asyncio
import json
from linkedin_scraper import BrowserManager, PersonScraper
from linkedin_scraper import CompanyScraper

async def scrape_user(username : str):
    # Initialize browser
    async with BrowserManager(headless=False) as browser:
        # Load authenticated session if it exists
        import os
        session_path = os.path.join(os.path.dirname(__file__), "playwright", "session.json")
        if os.path.exists(session_path):
            await browser.load_session(session_path)
        
        # Create scraper
        scraper = PersonScraper(browser.page)
        
        # Scrape a profile
        person = await scraper.scrape(f"https://linkedin.com/in/{username}/")
        

        returned_data = {
            "notes" : [],
            "people" : [],
            "companies" : [],
            "images" : []
        }

        # Extract raw text
        try:
            for i in person.experiences:
                returned_data['companies'].append(json.loads(i.json())['institution_name'])
                # check the actual institutions

        except:
            pass

        try:
            for i in person.educations:
                returned_data['companies'].append(json.loads(i.json())['institution_name'])
        except:
            pass

        try:
            for i in person.interests:
                returned_data['notes'].append(json.loads(i.json())['institution_name'])
        except:
            pass

        try:
            returned_data['notes'].append(person.location)
        except:
            pass
        
        try:
            returned_data['notes'].append(person.linkedin_url)
        except:
            pass

        return json.dumps(returned_data)

async def scrape_company(company : str):
    async with BrowserManager(headless=False) as browser:
        import os
        session_path = os.path.join(os.path.dirname(__file__), "playwright", "session.json")
        if os.path.exists(session_path):
            await browser.load_session(session_path)
        
        scraper = CompanyScraper(browser.page)
        company = await scraper.scrape(f"https://linkedin.com/company/{company}/")
        
        returned_data = {
            "notes" : [],
            "people" : [],
            "companies" : [],
            "images" : []
        }
        
        try:
            returned_data['notes'].append(company.phone)
        except:
            pass
        
        try:
            returned_data['nodes'].append(company.industry)
        except:
            pass
        
        try:
            returned_data['nodes'].append(company.linkedin_url)
        except:
            pass
        
        return json.dumps(returned_data)
                        

#response = asyncio.run(scrape_user("aathithy-aananth"))
#print(response)
#asyncio.run(scrape_user("aathithya-ananth"))
