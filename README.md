# Detective Board

An interactive detective board for visual investigations. Upload photos and organize findings on a draggable canvas.

## Key Files

### Core Application
- **`src/App.tsx`** - Root component, renders DetectiveBoard
- **`src/main.tsx`** - Entry point, mounts React app

### Main Components
- **`src/components/DetectiveBoard.tsx`** - Main board component using tldraw canvas. Handles:
  - Image uploads and drag-and-drop
  - Reverse image search (currently mocked)
  - Creating shapes on the board
  - Rope confirmation/rejection logic

- **`src/components/SearchPanel.tsx`** - Upload panel overlay for adding images to the board

### Custom Shapes
All extend tldraw's ShapeUtil for custom canvas elements:
- **`src/custom_shapes/ProfileCard.tsx`** - Displays person info (name, title, company, etc.)
- **`src/custom_shapes/PhotoPin.tsx`** - Pinned image on the board
- **`src/custom_shapes/NoteCard.tsx`** - Sticky notes for annotations
- **`src/custom_shapes/rope.tsx`** - Visual connections between shapes (red=pending, green=confirmed)

### Styles
- **`src/board.css`** - Board background and styling
- **`src/custom_shapes/shapes.css`** - Custom shape styles
- **`src/components/SearchPanel.css`** - Search panel overlay styles

## Running
```bash
npm install
npm run dev
```
