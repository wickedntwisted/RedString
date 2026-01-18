
import { useState, useCallback,useRef, useLayoutEffect, useEffect } from 'react'
import * as React from 'react'
import { 
  Tldraw, 
  Editor, 
  createShapeId,
  Box,
  DefaultToolbar,
  DefaultToolbarContent,
  TLComponents,
  TLUiAssetUrlOverrides,
  TLUiOverrides,
  TldrawUiMenuItem,
  useEditor,
  useIsToolSelected,
  useTools,
  useValue } from 'tldraw'
import 'tldraw/tldraw.css'
import "../board.css"
import "../custom_shapes/shapes.css"
import { SearchPanel } from './SearchPanel'
import { ProfileCardUtil } from '../custom_shapes/ProfileCard'
import { ProfileCardTool } from '../custom_tools/ProfileCardTool'
import { PhotoPinUtil } from '../custom_shapes/PhotoPin'
import { PhotoPinTool } from '../custom_tools/PhotoPinTool'
import { NoteCardUtil } from '../custom_shapes/NoteCard'
import { NoteCardTool } from '../custom_tools/NoteCardTool'
import { TemporalRopeUtil } from '../custom_shapes/TemporalRope'
import { RopeUtil } from '../custom_shapes/Rope'
import { RopeTool } from '../custom_tools/RopeTool'

// Custom shapes configuration - must be an array
const customShapes = [
	ProfileCardUtil,
	PhotoPinUtil,
	NoteCardUtil,
	TemporalRopeUtil,
	RopeUtil,
]

const customTool = [
  ProfileCardTool,
  PhotoPinTool,
  NoteCardTool,
  RopeTool
]

// Helper function to get the url for dropped web images
const getDraggedImageUrl = (dataTransfer: DataTransfer): string | null => {
  const uriList = dataTransfer.getData('text/uri-list')
  const plainText = dataTransfer.getData('text/plain')
  const html = dataTransfer.getData('text/html')

  const htmlMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  const candidate = (uriList || htmlMatch?.[1] || plainText || '').trim()

  if (!candidate) return null
  if (candidate.startsWith('data:image/')) return candidate

  try {
    new URL(candidate)
    return candidate
  } catch {
    return null
  }
}

// Helper function to convert image URL to File
const imageUrlToFile = async (imageUrl: string): Promise<File> => {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const urlName = imageUrl.startsWith('data:')
    ? 'image-from-web.png'
    : imageUrl.split('/').pop()?.split('?')[0] || 'image-from-web.png'
  const type = blob.type || 'image/png'

  return new File([blob], urlName, { type })
}

const bg_image = new window.Image()
bg_image.src = '/corkboard.webp'

const customUiOverrides: TLUiOverrides = {
	tools: (editor: any, tools: any) => {
		const whitelist = new Set(['select', 'hand', 'laser', 'eraser', 'draw', 'arrow', 'asset'])
		return {
			profile_card: {
				id: 'profile_card',
        label: 'Profile Card',
        icon: 'tool-profile',
        kbd: 'p',
        onSelect() {
          editor.setCurrentTool('profile_card')
        },
      },
			photo_pin: {
				id: 'photo_pin',
        label: 'Photo Pin',
        icon: 'tool-photo',
        kbd: 'l',
        onSelect() {
          editor.setCurrentTool('photo_pin')
        },
      },
			note_card: {
				id: 'note_card',
        label: 'Note Tool',
        icon: 'tool-note',
        kbd: 'l',
        onSelect() {
          editor.setCurrentTool('note_card')
        },
      },
			rope_tool: {
				id: 'rope_tool',
        label: 'Rope Tool',
        icon: 'tool-rope',
        kbd: 'r',
        onSelect() {
          editor.setCurrentTool('rope_tool')
        },
      },
			...Object.fromEntries(
				Object.entries(tools).filter(([id]) => whitelist.has(id))
			)
	  }
  }
}


function CustomToolbar() {
	const tools = useTools()
	return (
		<DefaultToolbar>
      <TldrawUiMenuItem {...tools['profile_card']} isSelected={useIsToolSelected(tools['profile_card'])} />
      <TldrawUiMenuItem {...tools['photo_pin']} isSelected={useIsToolSelected(tools['photo_pin'])} />
      <TldrawUiMenuItem {...tools['note_card']} isSelected={useIsToolSelected(tools['note_card'])} />
      <TldrawUiMenuItem {...tools['rope_tool']} isSelected={useIsToolSelected(tools['rope_tool'])} />
			<DefaultToolbarContent />
		</DefaultToolbar>
	)
}

const customAssetUrls: TLUiAssetUrlOverrides = {
	icons: {
		'tool-profile': '/profile.svg',
		'tool-photo': '/photo_pin.svg',
		'tool-note': '/note.svg',
		'tool-rope': '/rope.svg',
	},
}

const customComponents: TLComponents = {
	Toolbar: CustomToolbar,
	Grid: ({ size, ...camera }) => {
		const editor = useEditor()

		// [2]
		const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), [])
		const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, [])

		const canvas = useRef<HTMLCanvasElement>(null)

    useLayoutEffect(() => {
      if (!canvas.current) return
      
      const canvasW = screenBounds.w * devicePixelRatio
      const canvasH = screenBounds.h * devicePixelRatio
      canvas.current.width = canvasW
      canvas.current.height = canvasH
      const ctx = canvas.current?.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvasW, canvasH)
      
      // Check if image is loaded
      if (!bg_image.complete) {
        bg_image.onload = () => {
          // Trigger re-render when image loads
          canvas.current && drawTiledBackground()
        }
        return
      }
      
      drawTiledBackground()
      
      function drawTiledBackground() {
        if (!ctx || !bg_image.complete) return
        
        const pageViewportBounds = editor.getViewportPageBounds()
        
        // Calculate the tile size (use the grid size or image dimensions)
        const tileWidth = 400
        const tileHeight = 400
        
        // Determine the page-space bounds for tiling
        const startPageX = Math.floor(pageViewportBounds.minX / tileWidth) * tileWidth
        const startPageY = Math.floor(pageViewportBounds.minY / tileHeight) * tileHeight
        const endPageX = Math.ceil(pageViewportBounds.maxX / tileWidth) * tileWidth
        const endPageY = Math.ceil(pageViewportBounds.maxY / tileHeight) * tileHeight
        
        // Calculate number of tiles needed
        const numCols = Math.ceil((endPageX - startPageX) / tileWidth)
        const numRows = Math.ceil((endPageY - startPageY) / tileHeight)
        
        // Draw tiles
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const pageX = startPageX + col * tileWidth
            const pageY = startPageY + row * tileHeight
            
            // Convert page-space coordinates to canvas coordinates
            const canvasX = (pageX + camera.x) * camera.z * devicePixelRatio
            const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio
            const canvasTileW = tileWidth * camera.z * devicePixelRatio
            const canvasTileH = tileHeight * camera.z * devicePixelRatio
            
            // Draw the tiled image
            ctx.drawImage(bg_image, canvasX, canvasY, canvasTileW, canvasTileH)
          }
        }
      }
    }, [screenBounds, camera, size, devicePixelRatio, editor, bg_image])

		// [7]
		return <canvas className="tl-grid" ref={canvas} />
	},
}

type UploadImageResponse = {
  url?: string
  serpapi?: unknown
  error?: string
}

type GhuntLookupPayload = {
  imageUrl?: string
  filename?: string
}

async function uploadImageToFlask(file: File): Promise<UploadImageResponse | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('http://localhost:5000/api/upload-image', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    if (!response.ok) {
      console.error('Error uploading to Flask server:', data?.error || response.statusText)
      return data
    }
    console.log('Image uploaded:', data?.url)
    return data
  } catch (error) {
    console.error('Upload to Flask server failed:', error)
    return null
  }
}

async function triggerGhuntLookup(payload: GhuntLookupPayload): Promise<void> {
  if (!payload.imageUrl && !payload.filename) {
    return
  }

  try {
    const response = await fetch('http://localhost:5000/api/text-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error('Ghunt lookup failed:', data?.error || response.statusText)
      return
    }

    const data = await response.json().catch(() => ({}))
    console.log('Ghunt lookup response:', data)
  } catch (error) {
    console.error('Ghunt lookup request failed:', error)
  }
}

function AssetTracker() {
  const editor = useEditor()
  const savedAssets = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    if (!editor) return

    const checkAssets = () => {
      const assets = editor.getAssets()
      assets.forEach(async (asset) => {
        if (asset.type === 'image' && asset.props.src && !savedAssets.current.has(asset.id)) {
          const imageUrl = asset.props.src
          if (imageUrl.startsWith('data:')) {
            savedAssets.current.add(asset.id)
            // Convert data URL to blob and upload
            const blob = await fetch(imageUrl).then(r => r.blob())
            const file = new File([blob], 'image.png', { type: blob.type })
            await uploadImageToFlask(file)
          }
        }
      })
    }

    checkAssets()
    const interval = setInterval(checkAssets, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [editor])

  return null
}

export function DetectiveBoard() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSherlockSearching, setIsSherlockSearching] = useState(false)
  const [leadBranchingFactor, setLeadBranchingFactor] = useState(2)

  // Handle rope confirmation
  const handleRopeConfirm = useCallback((shapeId: string) => {
    if (!editor) return
    try {
      const shapeIdObj = shapeId as any
      const shape = editor.getShape(shapeIdObj)
      if (shape && (shape.type === 'temporal_rope' || shape.type === 'rope')) {
        editor.updateShape({
          id: shapeIdObj,
          type: shape.type,
          props: {
            ...shape.props,
            confirmed: true,
          },
        })
      }
    } catch (error) {
      console.error('Error confirming rope:', error)
    }
  }, [editor])

  // Handle rope discard
  const handleRopeDiscard = useCallback((shapeId: string) => {
    if (!editor) return
    try {
      const shapeIdObj = shapeId as any
      const shape = editor.getShape(shapeIdObj)
      if (shape) {
        if (shape.type === 'temporal_rope') {
          // Delete the target item (toShapeId)
          const toShapeId = (shape.props as any).toShapeId
          if (toShapeId) {
            try {
              // Check if the target shape still exists before attempting to delete
              if (editor.getShape(toShapeId as any)) {
                editor.deleteShape(toShapeId as any)
              }
            } catch (err) {
              console.error('Error deleting target shape:', err)
            }
          }
          // Delete the rope itself
          // Check if the rope shape still exists before attempting to delete
          if (editor.getShape(shapeIdObj)) {
            editor.deleteShape(shapeIdObj)
          }
        } else if (shape.type === 'rope') {
          // For 'rope' type, just unconfirm, do not delete
          editor.updateShape({
            id: shapeIdObj,
            type: 'rope',
            props: {
              ...shape.props,
              confirmed: false,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error discarding rope:', error)
    }
  }, [editor])

  // Set up event listeners for rope confirmation
  React.useEffect(() => {
    const handleConfirm = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.shapeId) {
        handleRopeConfirm(customEvent.detail.shapeId)
      }
    }

    const handleDiscard = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.shapeId) {
        handleRopeDiscard(customEvent.detail.shapeId)
      }
    }

    window.addEventListener('rope-confirm', handleConfirm)
    window.addEventListener('rope-discard', handleDiscard)

    return () => {
      window.removeEventListener('rope-confirm', handleConfirm)
      window.removeEventListener('rope-discard', handleDiscard)
    }
  }, [handleRopeConfirm, handleRopeDiscard])

  // Update rope positions when connected shapes move and clean up orphaned ropes
  React.useEffect(() => {
    if (!editor) return

    const updateRopePosition = (ropeShape: any, fromShape: any, toShape: any) => {
      // Calculate pin positions based on shape type
      let fromPinX: number, fromPinY: number, toPinX: number, toPinY: number

      // For photo-pin shapes
      if (fromShape.type === 'photo-pin') {
        const photoPinWidth = fromShape.props.w
        fromPinX = fromShape.x + photoPinWidth / 2
        fromPinY = fromShape.y + 20
      } else if (fromShape.type === 'profile-card') {
        const profileCardWidth = fromShape.props.w
        fromPinX = fromShape.x + profileCardWidth / 2
        fromPinY = fromShape.y + 28
      } else if (fromShape.type === 'note-card') {
        const noteCardWidth = fromShape.props.w
        fromPinX = fromShape.x + noteCardWidth / 2
        fromPinY = fromShape.y + 18
      } else {
        return // Unknown shape type
      }

      // For destination shape
      if (toShape.type === 'photo-pin') {
        const photoPinWidth = toShape.props.w
        toPinX = toShape.x + photoPinWidth / 2
        toPinY = toShape.y + 20
      } else if (toShape.type === 'profile-card') {
        const profileCardWidth = toShape.props.w
        toPinX = toShape.x + profileCardWidth / 2
        toPinY = toShape.y + 28
      } else if (toShape.type === 'note-card') {
        const noteCardWidth = toShape.props.w
        toPinX = toShape.x + noteCardWidth / 2
        toPinY = toShape.y + 18
      } else {
        return // Unknown shape type
      }

      // Calculate new angle and distance
      const dx = toPinX - fromPinX
      const dy = toPinY - fromPinY
      const angle = Math.atan2(dy, dx)
      const ropeLength = Math.sqrt(dx * dx + dy * dy)

      // Update rope
      editor.updateShape({
        id: ropeShape.id,
        type: ropeShape.type,
        x: fromPinX,
        y: fromPinY,
        rotation: angle,
        props: {
          ...ropeShape.props,
          w: ropeLength,
        },
      })
    }

    const handleShapeChange = () => {
      // Get all ropes
      const allShapes = editor.getCurrentPageShapes()
      const ropes = allShapes.filter((shape: any) => shape.type === 'temporal_rope' || shape.type === 'rope')

      // Track ropes to delete
      const ropesToDelete: string[] = []

      // Update each rope or mark for deletion if orphaned
      ropes.forEach((rope: any) => {
        const fromShapeId = rope.props.fromShapeId
        const toShapeId = rope.props.toShapeId

        if (fromShapeId && toShapeId) {
          const fromShape = editor.getShape(fromShapeId as any)
          const toShape = editor.getShape(toShapeId as any)

          // If either connected shape is missing, mark rope for deletion
          if (!fromShape || !toShape) {
            ropesToDelete.push(rope.id)
          } else {
            // Both shapes exist, update rope position
            updateRopePosition(rope, fromShape, toShape)
          }
        }
      })

      // Delete orphaned ropes
      if (ropesToDelete.length > 0) {
        editor.deleteShapes(ropesToDelete as any)
      }
    }

    // Listen to shape changes
    const dispose = editor.store.listen(handleShapeChange, { scope: 'document' })

    return () => {
      dispose()
    }
  }, [editor])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      Array.from(files).forEach(async (file) => {
        if (!file.type.startsWith('image/')) return
        
        console.log('File dropped:', file.name)
        await handleImageUpload(file)
      })
      return
    }

    const draggedImageUrl = getDraggedImageUrl(e.dataTransfer)
    
    // if valid image url
    if (draggedImageUrl) {
      try {
        const fileFromUrl = await imageUrlToFile(draggedImageUrl)
        await handleImageUpload(fileFromUrl)
      } catch (error) {
        console.error('Error handling dragged web image:', error)
      }
    }
  }

  // Helper function to check if a position collides with existing shapes
  const findNonCollidingPosition = useCallback((
    editor: Editor,
    startX: number,
    startY: number,
    width: number,
    height: number,
    padding: number = 50
  ): { x: number; y: number } => {
    const allShapes = editor.getCurrentPageShapes()

    // Function to check if a rectangle collides with any existing shape
    const checkCollision = (x: number, y: number): boolean => {
      for (const shape of allShapes) {
        const bounds = editor.getShapePageBounds(shape.id)
        if (!bounds) continue

        // Check if rectangles overlap (with padding)
        const hasOverlap = !(
          x + width + padding < bounds.minX ||
          x - padding > bounds.maxX ||
          y + height + padding < bounds.minY ||
          y - padding > bounds.maxY
        )

        if (hasOverlap) return true
      }
      return false
    }

    // Try the initial position
    if (!checkCollision(startX, startY)) {
      return { x: startX, y: startY }
    }

    // Try offsets in a spiral pattern
    const offsets = [
      { dx: 400, dy: 0 },    // Right
      { dx: 0, dy: 350 },    // Down
      { dx: -400, dy: 0 },   // Left
      { dx: 0, dy: -350 },   // Up
      { dx: 400, dy: 350 },  // Diagonal bottom-right
      { dx: -400, dy: 350 }, // Diagonal bottom-left
      { dx: 400, dy: -350 }, // Diagonal top-right
      { dx: -400, dy: -350 },// Diagonal top-left
      { dx: 800, dy: 0 },    // Far right
      { dx: 0, dy: 700 },    // Far down
      { dx: -800, dy: 0 },   // Far left
      { dx: 0, dy: -700 },   // Far up
    ]

    for (const offset of offsets) {
      const testX = startX + offset.dx
      const testY = startY + offset.dy
      if (!checkCollision(testX, testY)) {
        return { x: testX, y: testY }
      }
    }

    // If all else fails, place it far to the right
    return { x: startX + 1200, y: startY }
  }, [])

  const mainNotePosition = {x:0, y:0}
  function handleTextUpload(inputstr : string) {
    if (!editor) return

    // Constants for note card dimensions
    const noteCardWidth = 200
    const noteCardHeight = 150

    // Track messages and timeouts
    let messageCount = 0
    let timeoutId: NodeJS.Timeout | null = null
    let zoomDebounceId: NodeJS.Timeout | null = null

    // Helper to zoom to fit all content
    const zoomToFitAll = () => {
      const allShapes = editor.getCurrentPageShapes()
      if (allShapes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        allShapes.forEach((shape: any) => {
          const bounds = editor.getShapePageBounds(shape.id)
          if (bounds) {
            minX = Math.min(minX, bounds.minX)
            minY = Math.min(minY, bounds.minY)
            maxX = Math.max(maxX, bounds.maxX)
            maxY = Math.max(maxY, bounds.maxY)
          }
        })
        const padding = 100
        const contentBox = new Box(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2)
        editor.zoomToBounds(contentBox, { animation: { duration: 500 }, targetZoom: Math.min(editor.getZoomLevel(), 1) })
      }
    }

    // Debounced zoom
    const debouncedZoom = () => {
      if (zoomDebounceId) clearTimeout(zoomDebounceId)
      zoomDebounceId = setTimeout(zoomToFitAll, 500)
    }

    // Reset timeout for connection monitoring
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('[Sherlock] No message received in 30s, closing connection')
        setIsSherlockSearching(false)
        if (messageCount > 0) zoomToFitAll()
      }, 30000)
    }

    const original_id = createShapeId()
		editor.createShape({
      id : original_id,
		  type: 'note-card',
		  x: mainNotePosition.x,
		  y: mainNotePosition.y,
      props :{
        text : inputstr,
        w: noteCardWidth,
        h: noteCardHeight
      }
		})

    // Track result index for radial positioning
    let resultIndex = 0

    // Radial layout parameters
    const startAngle = Math.random() * 2 * Math.PI
    const direction = Math.random() < 0.5 ? 1 : -1
    const radius = 350
    const angleSpacing = Math.PI / 4 // 45 degrees between results

    // Main note center for positioning
    const mainNoteCenterX = mainNotePosition.x + noteCardWidth / 2
    const mainNoteCenterY = mainNotePosition.y + noteCardHeight / 2

    const eventSource2 = new EventSource('http://127.0.0.1:5000/api/search_naminter/'+inputstr);
    eventSource2.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Found NAMINTER DATA: ${data.name} at ${data.url}`);
        const new_id = createShapeId()
		    editor.createShape({
          id : new_id,
		      type: 'note-card',
		      x: 0,
		      y: 0,
          props :{
            text : `${data.name} : ${data.url}`
          }
		    })
        // Calculate angle for this result
        const angle = startAngle + (direction * angleSpacing * resultIndex)

        // Calculate ideal position using polar coordinates
        const idealX = mainNoteCenterX + radius * Math.cos(angle) - noteCardWidth / 2
        const idealY = mainNoteCenterY + radius * Math.sin(angle) - noteCardHeight / 2

        // Find non-colliding position with padding
        const position = findNonCollidingPosition(
          editor,
          idealX,
          idealY,
          noteCardWidth,
          noteCardHeight,
          50
        )

        const resultNoteId = createShapeId()
		    editor.createShape({
          id : resultNoteId,
		      type: 'note-card',
		      x: position.x,
		      y: position.y,
          props :{
            text : `${data.name} : ${data.url}`,
            w: noteCardWidth,
            h: noteCardHeight
          }
		    })

        // Create red rope connection from main note to result note
        // Calculate pin positions (at bottom of pin balls)
        // Note card pin: bottom of ball at top + 20px (6px offset + 14px height)
        const mainNotePinX = mainNoteCenterX
        const mainNotePinY = mainNotePosition.y + 20
        const resultNotePinX = position.x + noteCardWidth / 2
        const resultNotePinY = position.y + 20

        // Calculate angle and distance between pins
        const dx = resultNotePinX - mainNotePinX
        const dy = resultNotePinY - mainNotePinY
        const ropeAngle = Math.atan2(dy, dx)
        const ropeLength = Math.sqrt(dx * dx + dy * dy)

        // Position rope starting at the main note pin
        const ropeX = mainNotePinX
        const ropeY = mainNotePinY

        const ropeId = createShapeId()
        editor.createShape({
          id: ropeId,
          type: 'temporal_rope',
          x: ropeX,
          y: ropeY,
          rotation: ropeAngle,
          props: {
            w: ropeLength,
            h: 3,
            thickness: 3,
            confirmed: false,
            fromShapeId: original_id,
            toShapeId: resultNoteId,
          },
        })

        resultIndex++
    };
    eventSource2.onerror = () => {
      console.log("ERRORR")
        eventSource.close();
    };
    const eventSource = new EventSource('http://127.0.0.1:5000/api/search_sherlock/'+inputstr);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[Sherlock] Received message:', data);

        // Check if this is a completion message
        if (data.done) {
          console.log('[Sherlock] Received completion signal');
          if (timeoutId) clearTimeout(timeoutId)
          if (zoomDebounceId) clearTimeout(zoomDebounceId)
          eventSource.close();
          setIsSherlockSearching(false);
          // Final zoom to fit everything
          zoomToFitAll();
          return;
        }

        console.log(`[Sherlock] Found: ${data.name} at ${data.url}`);
        messageCount++
        resetTimeout()

        // Calculate angle for this result
        const angle = startAngle + (direction * angleSpacing * resultIndex)

        // Calculate ideal position using polar coordinates
        const idealX = mainNoteCenterX + radius * Math.cos(angle) - noteCardWidth / 2
        const idealY = mainNoteCenterY + radius * Math.sin(angle) - noteCardHeight / 2

        // Find non-colliding position with padding
        const position = findNonCollidingPosition(
          editor,
          idealX,
          idealY,
          noteCardWidth,
          noteCardHeight,
          50
        )

        const resultNoteId = createShapeId()
		    editor.createShape({
          id : resultNoteId,
		      type: 'note-card',
		      x: position.x,
		      y: position.y,
          props :{
            text : `${data.name} : ${data.url}`,
            w: noteCardWidth,
            h: noteCardHeight
          }
		    })

        // Create red rope connection from main note to result note
        // Calculate pin positions (at bottom of pin balls)
        // Note card pin: bottom of ball at top + 20px (6px offset + 14px height)
        const mainNotePinX = mainNoteCenterX
        const mainNotePinY = mainNotePosition.y + 20
        const resultNotePinX = position.x + noteCardWidth / 2
        const resultNotePinY = position.y + 20

        // Calculate angle and distance between pins
        const dx = resultNotePinX - mainNotePinX
        const dy = resultNotePinY - mainNotePinY
        const ropeAngle = Math.atan2(dy, dx)
        const ropeLength = Math.sqrt(dx * dx + dy * dy)

        // Position rope starting at the main note pin
        const ropeX = mainNotePinX
        const ropeY = mainNotePinY

        const ropeId = createShapeId()
        editor.createShape({
          id: ropeId,
          type: 'temporal_rope',
          x: ropeX,
          y: ropeY,
          rotation: ropeAngle,
          props: {
            w: ropeLength,
            h: 3,
            thickness: 3,
            confirmed: false,
            fromShapeId: original_id,
            toShapeId: resultNoteId,
          },
        })

        resultIndex++

        // Zoom out to fit all content after each new result (debounced)
        debouncedZoom()
    };

    eventSource.onerror = (error) => {
        console.log('[Sherlock] EventSource error:', error);
        if (timeoutId) clearTimeout(timeoutId)
        if (zoomDebounceId) clearTimeout(zoomDebounceId)
        eventSource.close();
        setIsSherlockSearching(false)
        // Only zoom if we got some results
        if (messageCount > 0) {
          zoomToFitAll()
        }
    };

    // Start initial timeout
    resetTimeout()

  }
  const handleImageUpload = useCallback(async (file: File | string) => {
    if (!editor) return

    setIsSearching(true)
    const draggedPic = typeof file === 'string' ? await imageUrlToFile(file) : file

    // Calculate position for new photo pin (outside try so it's available in catch)
    const allShapes = editor.getCurrentPageShapes()
    const existingPhotoPins = allShapes.filter((shape: any) => shape.type === 'photo-pin')

    let idealPhotoPinX = 300
    let idealPhotoPinY = 300

    if (existingPhotoPins.length > 0) {
      // Offset from the last photo pin
      const lastPin = existingPhotoPins[existingPhotoPins.length - 1]
      idealPhotoPinX = lastPin.x + 400 // Horizontal offset
      idealPhotoPinY = lastPin.y + 50  // Slight vertical offset
    }

    // Find non-colliding position for photo pin
    const photoPinSize = 200
    const photoPinPosition = findNonCollidingPosition(
      editor,
      idealPhotoPinX,
      idealPhotoPinY,
      photoPinSize,
      photoPinSize,
      80 // padding
    )

    const photoPinX = photoPinPosition.x
    const photoPinY = photoPinPosition.y

    try {
      // Read image as data URL
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(draggedPic)
      })

      // Add photo pin to board
      const photoPinId = createShapeId()
      editor.createShape({
        id: photoPinId,
        type: 'photo-pin',
        x: photoPinX,
        y: photoPinY,
        props: {
          w: photoPinSize,
          h: photoPinSize,
          imageUrl,
          caption: draggedPic.name,
        },
      })

      const uploadResponse = await uploadImageToFlask(draggedPic)
      if (uploadResponse) {
        console.log('Reverse image search response:', uploadResponse)
        await triggerGhuntLookup({
          imageUrl: uploadResponse.url,
          filename: draggedPic.name,
        })
      }

      // Initialize tracking for streaming results
      let profileCount = 0
      const profileShapesMap: Map<number, { id: string; x: number; y: number; profile: any }> = new Map()

      // Add a note card with search summary - position directly under photo pin
      const noteCardWidth = 200
      const noteCardHeight = 150
      const noteMargin = 12
      const leftOffset = 10
      const noteX = photoPinX + (photoPinSize - noteCardWidth) / 2 - leftOffset
      const noteY = photoPinY + photoPinSize + noteMargin
      const noteId = createShapeId()

      editor.createShape({
        id: noteId,
        type: 'note-card',
        x: noteX,
        y: noteY,
        props: {
          w: noteCardWidth,
          h: noteCardHeight,
          text: `Searching for LinkedIn profiles...\n\nStarted: ${new Date().toLocaleTimeString()}`,
          color: '#ffeb3b',
        },
      })

      // Profile card dimensions
      const profileCardWidth = 280
      const profileCardHeight = 200
      const cardPadding = 80

      // Radial layout parameters
      const startAngle = Math.random() * 2 * Math.PI
      const direction = Math.random() < 0.5 ? 1 : -1
      const radius = 450
      const photoPinCenterX = photoPinX + photoPinSize / 2
      const photoPinCenterY = photoPinY + photoPinSize / 2

      // Create profile card from streaming data
      const createProfileCard = (profile: any, index: number) => {
        const profileId = createShapeId()

        // Calculate angle for this profile card
        const angleSpacing = Math.PI / 6 // Fixed spacing between profiles
        const angle = startAngle + (direction * angleSpacing * index)

        // Calculate ideal position using polar coordinates
        const idealX = photoPinCenterX + radius * Math.cos(angle) - profileCardWidth / 2
        const idealY = photoPinCenterY + radius * Math.sin(angle) - profileCardHeight / 2

        // Find non-colliding position with padding
        const position = findNonCollidingPosition(
          editor,
          idealX,
          idealY,
          profileCardWidth,
          profileCardHeight,
          cardPadding
        )

        editor.createShape({
          id: profileId,
          type: 'profile-card',
          x: position.x,
          y: position.y,
          props: {
            w: profileCardWidth,
            h: profileCardHeight,
            name: profile.name || 'Unknown',
            title: profile.title || '',
            company: profile.company || '',
            linkedinUrl: profile.linkedinUrl || '',
            imageUrl: '',
            email: profile.email || '',
            location: profile.location || '',
          },
        })

        profileShapesMap.set(index, { id: profileId, x: position.x, y: position.y, profile })

        // Create red rope connection from photo pin to profile pin
        const photoPinAnchorX = photoPinX + photoPinSize / 2
        const photoPinAnchorY = photoPinY + 20
        const profilePinCenterX = position.x + profileCardWidth / 2
        const profilePinCenterY = position.y + 28

        // Calculate angle and distance between pins
        const dx = profilePinCenterX - photoPinAnchorX
        const dy = profilePinCenterY - photoPinAnchorY
        const ropeAngle = Math.atan2(dy, dx)
        const ropeLength = Math.sqrt(dx * dx + dy * dy)

        // Position rope starting at the photo pin
        const ropeX = photoPinAnchorX
        const ropeY = photoPinAnchorY

        const ropeId = createShapeId()
        editor.createShape({
          id: ropeId,
          type: 'temporal_rope',
          x: ropeX,
          y: ropeY,
          rotation: ropeAngle,
          props: {
            w: ropeLength,
            h: 3,
            thickness: 3,
            confirmed: false,
            fromShapeId: photoPinId,
            toShapeId: profileId,
          },
        })

        profileCount++
      }

      // Start EventSource streaming
      const eventSource = new EventSource(
        `http://127.0.0.1:5000/api/process-image-leads/${draggedPic.name}`
      )

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('[LinkedIn] Received message:', data)

        if (data.status === 'starting') {
          console.log(`[LinkedIn] Starting to process ${data.total} profiles`)
          editor.updateShape({
            id: noteId,
            type: 'note-card',
            props: {
              w: noteCardWidth,
              h: noteCardHeight,
              text: `Found ${data.total} LinkedIn profile${data.total !== 1 ? 's' : ''}\n\nScraping profiles...`,
              color: '#ffeb3b',
            },
          })
        }

        if (data.status === 'profile') {
          console.log(`[LinkedIn] Creating profile card for index ${data.index}`)
          createProfileCard(data.profile, data.index)

          // Update note card with progress
          editor.updateShape({
            id: noteId,
            type: 'note-card',
            props: {
              w: noteCardWidth,
              h: noteCardHeight,
              text: `Scraped ${profileCount} profile${profileCount !== 1 ? 's' : ''}\n\nProcessing...`,
              color: '#ffeb3b',
            },
          })
        }

        if (data.status === 'error') {
          console.error(`[LinkedIn] Error at index ${data.index}:`, data.error)
        }

        if (data.status === 'complete') {
          console.log('[LinkedIn] Streaming complete')
          eventSource.close()
          setIsSearching(false)

          // Update final note
          editor.updateShape({
            id: noteId,
            type: 'note-card',
            props: {
              w: noteCardWidth,
              h: noteCardHeight,
              text: `Created ${profileCount} lead${profileCount !== 1 ? 's' : ''}\n\nCompleted: ${new Date().toLocaleTimeString()}`,
              color: '#ffeb3b',
            },
          })

          // Create ropes between profiles with commonalities
          const profileShapes = Array.from(profileShapesMap.values())
          for (let i = 0; i < profileShapes.length; i++) {
            for (let j = i + 1; j < profileShapes.length; j++) {
              const profile1 = profileShapes[i]
              const profile2 = profileShapes[j]

              // Check for commonalities
              const hasCommonCompany = profile1.profile.company && profile2.profile.company &&
                                      profile1.profile.company === profile2.profile.company
              const hasCommonLocation = profile1.profile.location && profile2.profile.location &&
                                       profile1.profile.location === profile2.profile.location
              const hasCommonDomain = profile1.profile.email && profile2.profile.email &&
                                     profile1.profile.email.split('@')[1] === profile2.profile.email.split('@')[1]

              if (hasCommonCompany || hasCommonLocation || hasCommonDomain) {
                const ropeId = createShapeId()

                // Calculate pin positions
                const profile1PinCenterX = profile1.x + profileCardWidth / 2
                const profile1PinCenterY = profile1.y + 28
                const profile2PinCenterX = profile2.x + profileCardWidth / 2
                const profile2PinCenterY = profile2.y + 28

                // Calculate angle and distance between pins
                const dx = profile2PinCenterX - profile1PinCenterX
                const dy = profile2PinCenterY - profile1PinCenterY
                const ropeAngle = Math.atan2(dy, dx)
                const ropeLength = Math.sqrt(dx * dx + dy * dy)

                // Position rope starting at profile1 pin
                const ropeX = profile1PinCenterX
                const ropeY = profile1PinCenterY

                editor.createShape({
                  id: ropeId,
                  type: 'temporal_rope',
                  x: ropeX,
                  y: ropeY,
                  rotation: ropeAngle,
                  props: {
                    w: ropeLength,
                    h: 3,
                    thickness: 3,
                    confirmed: false,
                    fromShapeId: profile1.id,
                    toShapeId: profile2.id,
                  },
                })
              }
            }
          }

          // Auto-zoom to fit all elements
          setTimeout(() => {
            const allShapes = editor.getCurrentPageShapes()
            if (allShapes.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

              allShapes.forEach((shape: any) => {
                const bounds = editor.getShapePageBounds(shape.id)
                if (bounds) {
                  minX = Math.min(minX, bounds.minX)
                  minY = Math.min(minY, bounds.minY)
                  maxX = Math.max(maxX, bounds.maxX)
                  maxY = Math.max(maxY, bounds.maxY)
                }
              })

              const padding = 100
              const contentBox = new Box(
                minX - padding,
                minY - padding,
                maxX - minX + padding * 2,
                maxY - minY + padding * 2
              )

              editor.zoomToBounds(contentBox, {
                animation: { duration: 500 },
                targetZoom: Math.min(editor.getZoomLevel(), 1)
              })
            }
          }, 100)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[LinkedIn] EventSource error:', error)
        eventSource.close()
        setIsSearching(false)

        // Update note with error
        editor.updateShape({
          id: noteId,
          type: 'note-card',
          props: {
            w: noteCardWidth,
            h: noteCardHeight,
            text: `Error: Connection failed\n\nPlease try again.`,
            color: '#ffcdd2',
          },
        })
      }

    } catch (error) {
      console.error('Error processing image:', error)

      // Add error note - position centered under photo pin with slim margin
      const errorNoteId = createShapeId()
      const errorNoteWidth = 200
      const errorLeftOffset = 10 // Slight offset to the left
      const errorMargin = 12 // Slim margin between photo pin and note card
      editor.createShape({
        id: errorNoteId,
        type: 'note-card',
        x: photoPinX + (photoPinSize - errorNoteWidth) / 2 - errorLeftOffset,
        y: photoPinY + photoPinSize + errorMargin,
        props: {
          w: 200,
          h: 120,
          text: 'Error: Could not find profiles.\n\nPlease try again.',
          color: '#ffcdd2',
        },
      })
    } finally {
      setIsSearching(false)
    }
  }, [editor, findNonCollidingPosition, leadBranchingFactor])

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDropCapture={handleDrop}
      onDragOverCapture={(e) => {  
        e.preventDefault()
      }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Tldraw 
        shapeUtils={customShapes}
        tools={customTool}
        overrides={customUiOverrides}
        assetUrls={customAssetUrls}
        components={customComponents}
        onMount={(editor) => {
          setEditor(editor)
          editor.updateInstanceState({ isGridMode: true })
        }}
      >
        <AssetTracker />
      </Tldraw>
      <SearchPanel
        onImageUpload={handleImageUpload}
        onTextSearch={handleTextUpload}
        isSearching={isSearching}
      />
      {/* Lead Branching Factor Slider */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '240px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 69, 19, 0.3)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '200px',
        }}
      >
        <label
          htmlFor="branching-slider"
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#8b4513',
            whiteSpace: 'nowrap',
          }}
        >
          Leads: {leadBranchingFactor}
        </label>
        <input
          id="branching-slider"
          type="range"
          min="1"
          max="10"
          value={leadBranchingFactor}
          onChange={(e) => setLeadBranchingFactor(parseInt(e.target.value))}
          style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            background: `linear-gradient(to right, #8b4513 0%, #8b4513 ${(leadBranchingFactor - 1) * 11.11}%, #ddd ${(leadBranchingFactor - 1) * 11.11}%, #ddd 100%)`,
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Sherlock Searching Indicator */}
      {isSherlockSearching && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(139, 69, 19, 0.95)',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(220, 38, 38, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'sherlockFadeIn 0.3s ease-in',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.5px',
            }}
          >
            Sherlock is investigating...
          </span>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes sherlockFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
    </div>
  )
}