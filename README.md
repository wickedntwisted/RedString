# Detective Board

An interactive detective corkboard built with `tldraw`. Drop an image, see mock profile matches, and connect evidence with red-string ropes.

## Features

- Corkboard-style canvas with custom background tiles
- Custom shapes: photo pins, profile cards, notes, and rope connections
- Drag-and-drop image uploads
- Mock reverse image search results (easy to replace with a real API)
- Optional image storage backend via Flask + MySQL

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```
2. Start the frontend:
   ```
   npm run dev
   ```

Vite prints the local URL in the terminal (usually `http://localhost:5173`).

## Optional Backend (Image Storage)

The frontend can post uploaded image URLs to a Flask server at
`http://localhost:5000/api/upload-image`.

### Setup

1. Install Python deps:
   ```
   pip install flask flask-cors python-dotenv mysql-connector-python
   ```
2. Set environment variables in a `.env` file:
   ```
   VULTR_HOST=
   VULTR_PORT=3306
   VULTR_USER=
   VULTR_NAME=
   VULTR_PASSWORD=
   ```
3. Run the server:
   ```
   python backend/image_storing_server.py
   ```

If the backend is not running, the frontend will still work, but image-save calls
will fail and log errors.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build for production
- `npm run lint` — run ESLint
- `npm run preview` — preview the production build

## Project Structure

- `src/components/DetectiveBoard.tsx` — main board UI and logic
- `src/components/SearchPanel.tsx` — upload panel UI
- `src/custom_shapes/` — custom tldraw shapes
- `backend/image_storing_server.py` — optional Flask API for image storage
