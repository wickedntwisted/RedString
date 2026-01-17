import mysql.connector
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from reverse_img_api import reverse_image_search

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    host = os.getenv("VULTR_HOST")
    db_port = os.getenv("VULTR_PORT")
    user = os.getenv("VULTR_USER")
    database = os.getenv("VULTR_NAME")
    password = os.getenv("VULTR_PASSWORD")
    
    port = int(db_port) if db_port else 3306
    
    if not all([host, database, user]):
        missing = []
        if not host:
            missing.append('VULTR_HOST')
        if not database:
            missing.append('VULTR_NAME')
        if not user:
            missing.append('VULTR_USER')
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}. Please check your .env file.")
    
    return mysql.connector.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password,
    )

def exec_commit(sql, params=()):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        cur.close()
        conn.close()

def fetch_one(sql, params=()):
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        result = cur.fetchone()
        return result
    finally:
        cur.close()
        conn.close()

def fetch_all(sql, params=()):
    conn = get_db_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        result = cur.fetchall()
        return result
    finally:
        cur.close()
        conn.close()

def store_image_url(image_url):
    return exec_commit("INSERT INTO images (url) VALUES (%s);", (image_url,))

def get_image_url(image_id):
    row = fetch_one("SELECT url FROM images WHERE id = %s;", (image_id,))
    return row["url"] if row else None

def get_last_image():
    """Get the most recent image (last inserted) from the database"""
    row = fetch_one("SELECT id, url FROM images ORDER BY id DESC LIMIT 1;")
    return row if row else None

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.get_json()
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({'error': 'No image URL provided'}), 400
        
        image_id = store_image_url(image_url)
        
        return jsonify({
            'success': True,
            'image_id': image_id,
            'message': 'Image stored successfully'
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-image/<int:image_id>', methods=['GET'])
def get_image(image_id):
    try:
        image_url = get_image_url(image_id)
        
        if not image_url:
            return jsonify({'error': 'Image not found'}), 404
        
        return jsonify({
            'success': True,
            'image_url': image_url
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/list-images', methods=['GET'])
def list_images():
    try:
        # Get optional query parameters for pagination
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Fetch all images from database (using id and url columns which should exist)
        rows = fetch_all("SELECT id, url FROM images ORDER BY id DESC LIMIT %s OFFSET %s;", (limit, offset))
        
        # Get total count
        count_row = fetch_one("SELECT COUNT(*) as total FROM images;")
        total = count_row['total'] if count_row else 0
        
        return jsonify({
            'success': True,
            'total': total,
            'count': len(rows),
            'images': rows
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search-image/<int:image_id>', methods=['GET'])
def search_image_by_id(image_id):
    """
    Perform reverse image search on an image stored in the database by its ID.
    """
    try:
        # Get image URL from database
        image_url = get_image_url(image_id)
        
        if not image_url:
            return jsonify({
                'success': False,
                'error': 'Image not found'
            }), 404
        
        # Perform reverse image search
        search_result = reverse_image_search(image_url)
        
        return jsonify({
            'success': search_result.get('success', False),
            'image_id': image_id,
            'image_url': image_url[:100] + '...' if len(image_url) > 100 else image_url,  # Truncate for display
            'search_results': search_result.get('results', []),
            'total_results': search_result.get('total_results', 0),
            'error': search_result.get('error')
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search-image-url', methods=['POST'])
def search_image_by_url():
    """
    Perform reverse image search on a provided image URL.
    """
    try:
        data = request.get_json()
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({
                'success': False,
                'error': 'No image URL provided'
            }), 400
        
        # Perform reverse image search
        search_result = reverse_image_search(image_url)
        
        return jsonify({
            'success': search_result.get('success', False),
            'search_results': search_result.get('results', []),
            'total_results': search_result.get('total_results', 0),
            'error': search_result.get('error')
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/search-last-image', methods=['GET'])
def search_last_image():
    """
    Perform reverse image search on the last (most recent) image in the database.
    """
    try:
        # Get the last image from database
        last_image = get_last_image()
        
        if not last_image:
            return jsonify({
                'success': False,
                'error': 'No images found in database'
            }), 404
        
        image_id = last_image['id']
        image_url = last_image['url']
        
        # Perform reverse image search
        search_result = reverse_image_search(image_url)
        
        return jsonify({
            'success': search_result.get('success', False),
            'image_id': image_id,
            'image_url': image_url[:100] + '...' if len(image_url) > 100 else image_url,  # Truncate for display
            'search_results': search_result.get('results', []),
            'total_results': search_result.get('total_results', 0),
            'error': search_result.get('error')
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)