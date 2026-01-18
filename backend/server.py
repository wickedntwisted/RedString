import boto3
import asyncio
import os
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from werkzeug.utils import secure_filename
from serpapi import GoogleSearch
from linkedin_service import scrape_user, scrape_company
<<<<<<< HEAD
from sherlock_generator import stream_sherlock
import time
=======
>>>>>>> 8308dbe52dd93131976eee139a6e812327f8bddb

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
CORS(app)

def build_image_url(filename: str) -> str:
    return f"https://{hostname}/{bucket_name}/{filename}"

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
            "q": f"site:linkedin.com",
            "tbm": "isch",  # image search
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
        if request.method == 'POST':
            print(request.json)
            # call ghunt with the request json text
            username = request.json['text']
            return "HELLO WORLD"
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<username>')
def search_username(username):
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
