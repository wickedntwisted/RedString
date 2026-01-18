import boto3
import asyncio
import os
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from serpapi import GoogleSearch
from linkedin_service import scrape_user, scrape_company, scrape_user_for_profile_card
from sherlock_generator import stream_sherlock
from naminter_generator import stream_naminter
import time

load_dotenv()

hostname = os.getenv("VULTR_HOST_NAME")
secret_key = os.getenv("VULTR_S3_SECRET_KEY")
access_key = os.getenv("VULTR_S3_ACCESS_KEY")
bucket_name = os.getenv("VULTR_BUCKET_NAME")
serp_api_key = os.getenv("SERP_API_KEY")

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "serp_results")
os.makedirs(RESULTS_DIR, exist_ok=True)

print(f"Loaded config - Host: {hostname}, Bucket: {bucket_name}")

session = boto3.session.Session()
client = session.client('s3', **{
    "region_name": hostname.split('.')[0],
    "endpoint_url": "https://" + hostname,
    "aws_access_key_id": access_key,
    "aws_secret_access_key": secret_key
})

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)

def build_image_url(filename: str) -> str:
    return f"https://{hostname}/{bucket_name}/{filename}"

def extract_linkedin_profiles_from_serp(serp_results: dict) -> list:
    """Extract LinkedIn usernames from SerpAPI results."""
    serpapi = serp_results.get('serpapi', {})
    usernames = []

    # Check organic_results
    organic_results = serpapi.get('organic_results', [])
    print(f"[DEBUG] Found {len(organic_results)} organic results")

    for result in organic_results:
        link = result.get('link', '')

        # Extract from profile URLs: linkedin.com/in/username
        if 'linkedin.com/in/' in link:
            username = link.split('linkedin.com/in/')[1].split('/')[0].split('?')[0]
            usernames.append(username)
            print(f"[DEBUG] Found LinkedIn profile: {username}")

        # Extract from post URLs: linkedin.com/posts/username_
        elif 'linkedin.com/posts/' in link:
            username = link.split('linkedin.com/posts/')[1].split('_')[0].split('/')[0].split('?')[0]
            usernames.append(username)
            print(f"[DEBUG] Found LinkedIn profile from post: {username}")

    # Also check image_results if present
    image_results = serpapi.get('image_results', [])
    print(f"[DEBUG] Found {len(image_results)} image results")

    for idx, result in enumerate(image_results):
        # Log all fields for debugging
        print(f"[DEBUG] Image result {idx}: {result.keys()}")

        # Check various possible URL fields
        link = result.get('link', '') or result.get('source', '') or result.get('original', '') or result.get('thumbnail', '')
        title = result.get('title', '')
        snippet = result.get('snippet', '')

        # Also check if LinkedIn is mentioned in title/snippet
        if 'linkedin' in link.lower() or 'linkedin' in title.lower():
            print(f"[DEBUG] Found LinkedIn mention: link={link}, title={title}")

        # Extract from profile URLs: linkedin.com/in/username
        if 'linkedin.com/in/' in link:
            username = link.split('linkedin.com/in/')[1].split('/')[0].split('?')[0]
            usernames.append(username)
            print(f"[DEBUG] Found LinkedIn profile in images: {username}")

        # Extract from post URLs: linkedin.com/posts/username_
        if 'linkedin.com/posts/' in link:
            print(f"[DEBUG] Extracting from post URL: {link}")
            try:
                username = link.split('linkedin.com/posts/')[1].split('_')[0].split('/')[0].split('?')[0]
                usernames.append(username)
                print(f"[DEBUG] Found LinkedIn profile from post in images: {username}")
            except Exception as e:
                print(f"[DEBUG] Error extracting username: {e}")

    unique_usernames = list(set(usernames))
    print(f"[DEBUG] Total unique LinkedIn profiles: {len(unique_usernames)}")
    return unique_usernames

@app.route("/", methods=['GET'])
def root():
    return "HELLO I LOVE U"

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        filename = secure_filename(file.filename)
        file_data = file.read()
        
        print(f"Uploading: {filename} ({len(file_data)} bytes)")
        
        client.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=file_data,
            ContentType=file.content_type,
            ACL='public-read'  # ensure public access for SerpApi
        )
        
        file_url = build_image_url(filename)

        if not serp_api_key:
            return jsonify({'url': file_url, 'error': 'Missing SERP_API_KEY'}), 500

        params = {
            "engine": "google_reverse_image",
            "image_url": file_url,
            "api_key": serp_api_key,
        }
        search = GoogleSearch(params)
        results = search.get_dict()

        # Write result to JSON file under backend/serp_results/<filename>.json
        results_path = os.path.join(RESULTS_DIR, f"{filename}.json")
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump({"url": file_url, "serpapi": results}, f, ensure_ascii=False, indent=2)

        return jsonify({
            "url": file_url,
            "serpapi": results
        }), 201
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-image/<filename>', methods=['GET'])
def get_image(filename):
    try:
        file_url = build_image_url(filename)
        return jsonify({'success': True, 'url': file_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/linkedin_scrape_user/<user>', methods=['GET'])
def linkedin_scrape_user(user : str):
    try:
        data = asyncio.run(scrape_user(user))
        return jsonify(json.loads(data)), 200
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/linkedin_scrape_company/<company>', methods=['GET'])
def linkedin_scrape_company(company : str):
    try:
        data = asyncio.run(scrape_company(company))
        return jsonify(json.loads(data)), 200
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/text-search', methods=['POST'])
def get_text():
    try:
        payload = request.get_json(silent=True) or {}
        text = payload.get('text', '')
        image_url = payload.get('imageUrl', '')
        filename = payload.get('filename', '')

        # call ghunt with the payload
        print(f"GHunt payload: text={text}, imageUrl={image_url}, filename={filename}")

        return jsonify({
            'status': 'queued',
            'text': text,
            'imageUrl': image_url,
            'filename': filename,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search_sherlock/<username>')
def search_sherlock_username(username):
    print(f"searching for user: {username}")
    async def generate():
        async for result in stream_sherlock(username):
            yield f"data: {result}\n\n"  # SSE format

    # Run async generator in sync context
    def sync_generate():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            async_gen = generate()
            while True:
                try:
                    result = loop.run_until_complete(async_gen.__anext__())
                    yield result
                except StopAsyncIteration:
                    print(f"[DEBUG] Stream complete for username: {username}")
                    break
        finally:
            loop.close()

    return Response(
        stream_with_context(sync_generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'  # Disable nginx buffering
        }
    )

@app.route('/api/search_naminter/<username>')
def search_naminter_username(username):
    print(f"searching for NAMINTER user: {username}")
    async def generate():
        async for result in stream_naminter(username):
            yield f"data: {result}\n\n"  # SSE format
    
    # Run async generator in sync context
    def sync_generate():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            async_gen = generate()
            while True:
                try:
                    yield loop.run_until_complete(async_gen.__anext__())
                except StopAsyncIteration:
                    break
        finally:
            loop.close()
    
    return Response(
        stream_with_context(sync_generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'  # Disable nginx buffering
        }
    )

async def stream_linkedin_profiles(filename: str):
    """Stream LinkedIn profiles from SerpAPI results."""
    try:
        # Load SerpAPI results
        results_path = os.path.join(RESULTS_DIR, f"{filename}.json")
        if not os.path.exists(results_path):
            yield json.dumps({"status": "error", "error": "SerpAPI results not found"})
            return

        with open(results_path, "r", encoding="utf-8") as f:
            serp_data = json.load(f)

        # Extract LinkedIn usernames
        usernames = extract_linkedin_profiles_from_serp(serp_data)

        if not usernames:
            yield json.dumps({"status": "complete", "total": 0})
            return

        # Limit to max 10 profiles
        usernames = usernames[:10]

        # Send starting message
        yield json.dumps({"status": "starting", "total": len(usernames)})
        await asyncio.sleep(0.1)

        # Stream each profile
        for i, username in enumerate(usernames):
            try:
                profile = await scrape_user_for_profile_card(username)

                if profile:
                    yield json.dumps({
                        "status": "profile",
                        "index": i,
                        "profile": profile
                    })
                else:
                    yield json.dumps({
                        "status": "error",
                        "index": i,
                        "error": f"Failed to scrape profile {username}"
                    })

                # Rate limiting: 3-second delay between scrapes
                if i < len(usernames) - 1:
                    await asyncio.sleep(3)

            except Exception as e:
                print(f"Error processing profile {username}: {str(e)}")
                yield json.dumps({
                    "status": "error",
                    "index": i,
                    "error": str(e)
                })

        # Send completion message
        yield json.dumps({"status": "complete"})

    except Exception as e:
        print(f"Error in stream_linkedin_profiles: {str(e)}")
        import traceback
        traceback.print_exc()
        yield json.dumps({"status": "error", "error": str(e)})

@app.route('/api/process-image-leads/<filename>')
def process_image_leads(filename):
    """Stream LinkedIn profiles from uploaded image results."""
    print(f"Processing image leads for: {filename}")

    async def generate():
        async for result in stream_linkedin_profiles(filename):
            yield f"data: {result}\n\n"

    # Run async generator in sync context (same pattern as sherlock)
    def sync_generate():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            async_gen = generate()
            while True:
                try:
                    result = loop.run_until_complete(async_gen.__anext__())
                    yield result
                except StopAsyncIteration:
                    print(f"[DEBUG] Stream complete for image: {filename}")
                    break
        finally:
            loop.close()

    return Response(
        stream_with_context(sync_generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
