import { useState, useCallback } from 'react'
import * as React from 'react'
import { Tldraw, Editor, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import "../board.css"
import "../custom_shapes/shapes.css"
import { SearchPanel } from './SearchPanel'
import { ProfileCardUtil } from '../custom_shapes/ProfileCard'
import { PhotoPinUtil } from '../custom_shapes/PhotoPin'
import { NoteCardUtil } from '../custom_shapes/NoteCard'
import { RopeUtil } from '../custom_shapes/rope'

// Custom shapes configuration - must be an array
const customShapes = [
	ProfileCardUtil,
	PhotoPinUtil,
	NoteCardUtil,
	RopeUtil,
]

export function DetectiveBoard() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Handle rope confirmation
  const handleRopeConfirm = useCallback((shapeId: string) => {
    if (!editor) return
    try {
      const shapeIdObj = shapeId as any
      const shape = editor.getShape(shapeIdObj)
      if (shape && shape.type === 'rope') {
        editor.updateShape({
          id: shapeIdObj,
          type: 'rope',
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
      if (shape && shape.type === 'rope') {
        // Delete the target item (toShapeId)
        const toShapeId = (shape.props as any).toShapeId
        if (toShapeId) {
          try {
            editor.deleteShape(toShapeId as any)
          } catch (err) {
            console.error('Error deleting target shape:', err)
          }
        }
        // Delete the rope itself
        editor.deleteShape(shapeIdObj)
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

  // Update rope positions when connected shapes move
  React.useEffect(() => {
    if (!editor) return

    const updateRopePosition = (ropeShape: any, fromShape: any, toShape: any) => {
      // Calculate pin positions based on shape type
      let fromPinX: number, fromPinY: number, toPinX: number, toPinY: number

      // For photo-pin shapes
      if (fromShape.type === 'photo-pin') {
        const photoPinWidth = fromShape.props.w
        fromPinX = fromShape.x + photoPinWidth / 2
        fromPinY = fromShape.y + 12
      } else if (fromShape.type === 'profile-card') {
        const profileCardWidth = fromShape.props.w
        fromPinX = fromShape.x + profileCardWidth / 2
        fromPinY = fromShape.y + 18
      } else {
        return // Unknown shape type
      }

      // For destination shape
      if (toShape.type === 'photo-pin') {
        const photoPinWidth = toShape.props.w
        toPinX = toShape.x + photoPinWidth / 2
        toPinY = toShape.y + 12
      } else if (toShape.type === 'profile-card') {
        const profileCardWidth = toShape.props.w
        toPinX = toShape.x + profileCardWidth / 2
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
        type: 'rope',
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
      const ropes = allShapes.filter((shape: any) => shape.type === 'rope')

      // Update each rope
      ropes.forEach((rope: any) => {
        const fromShapeId = rope.props.fromShapeId
        const toShapeId = rope.props.toShapeId

        if (fromShapeId && toShapeId) {
          const fromShape = editor.getShape(fromShapeId as any)
          const toShape = editor.getShape(toShapeId as any)

          if (fromShape && toShape) {
            updateRopePosition(rope, fromShape, toShape)
          }
        }
      })
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          handleImageUpload(file)
        }
      })
    }
  }

  // Mock function for reverse image search - replace with actual API call
  const performReverseImageSearch = async (imageFile: File): Promise<any[]> => {
    // TODO: Replace this with actual reverse image search API
    // Examples: Google Vision API, TinEye API, PimEyes, etc.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock data - replace with actual API response
    return [
      {
        name: 'John Doe',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        imageUrl: URL.createObjectURL(imageFile),
        email: 'john.doe@techcorp.com',
        location: 'San Francisco, CA',
      },
      {
        name: 'Jane Smith',
        title: 'Product Manager',
        company: 'StartupXYZ',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        imageUrl: URL.createObjectURL(imageFile),
        location: 'New York, NY',
      },
    ]
  }

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    setIsSearching(true)
    
    try {
      // Read image as data URL
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Add photo pin to board - place it more to the left side
      const photoPinId = createShapeId()
      const photoPinX = 300
      const photoPinY = 300
      editor.createShape({
        id: photoPinId,
        type: 'photo-pin',
        x: photoPinX,
        y: photoPinY,
        props: {
          w: 200,
          h: 200,
          imageUrl,
          caption: file.name,
        },
      })

      // Perform reverse image search
      const searchResults = await performReverseImageSearch(file)

      // Store profile shapes for creating connections
      const profileShapes: Array<{ id: string; x: number; y: number; profile: any }> = []

      // Add profile cards in a better layout - spread them out more
      // Arrange in a fan pattern with more spacing
      const horizontalSpacing = 380
      const verticalSpacing = 320
      const startX = photoPinX + 550 // Much more distance from photo
      const startY = 100
      
      // Arrange in a grid with max 2 columns to spread them out more
      const cols = Math.min(2, searchResults.length)

      searchResults.forEach((profile, index) => {
        const profileId = createShapeId()
        const col = index % cols
        const row = Math.floor(index / cols)
        const profileX = startX + col * horizontalSpacing
        const profileY = startY + row * verticalSpacing

        editor.createShape({
          id: profileId,
          type: 'profile-card',
          x: profileX,
          y: profileY,
          props: {
            w: 280,
            h: 200,
            name: profile.name,
            title: profile.title,
            company: profile.company,
            linkedinUrl: profile.linkedinUrl,
            imageUrl: profile.imageUrl,
            email: profile.email,
            location: profile.location,
          },
        })

        profileShapes.push({ id: profileId, x: profileX, y: profileY, profile })

        // Create red rope connection from photo pin to profile pin
        const photoPinWidth = 200
        const profileCardWidth = 280

        // Calculate pin positions (pins are centered at top of each card)
        // Photo pin: center at top + 12px (4px offset + 16px height / 2)
        // Profile card pin: center at top + 18px (8px offset + 20px height / 2)
        const photoPinCenterX = photoPinX + photoPinWidth / 2
        const photoPinCenterY = photoPinY + 12
        const profilePinCenterX = profileX + profileCardWidth / 2
        const profilePinCenterY = profileY + 18

        // Calculate angle and distance between pins
        const dx = profilePinCenterX - photoPinCenterX
        const dy = profilePinCenterY - photoPinCenterY
        const angle = Math.atan2(dy, dx)
        const ropeLength = Math.sqrt(dx * dx + dy * dy)

        // Position rope starting at the photo pin
        const ropeX = photoPinCenterX
        const ropeY = photoPinCenterY

        const ropeId = createShapeId()
        editor.createShape({
          id: ropeId,
          type: 'rope',
          x: ropeX,
          y: ropeY,
          rotation: angle,
          props: {
            w: ropeLength,
            h: 3,
            thickness: 3,
            confirmed: false,
            fromShapeId: photoPinId,
            toShapeId: profileId,
          },
        })
      })

      // Create ropes between profiles that have things in common
      for (let i = 0; i < profileShapes.length; i++) {
        for (let j = i + 1; j < profileShapes.length; j++) {
          const profile1 = profileShapes[i]
          const profile2 = profileShapes[j]
          
          // Check for commonalities
          const hasCommonCompany = profile1.profile.company === profile2.profile.company
          const hasCommonLocation = profile1.profile.location === profile2.profile.location
          const hasCommonDomain = profile1.profile.email?.split('@')[1] === profile2.profile.email?.split('@')[1]
          
          if (hasCommonCompany || hasCommonLocation || hasCommonDomain) {
            const ropeId = createShapeId()
            const profileCardWidth = 280

            // Calculate pin positions (pins are centered at top of cards)
            // Profile card pin: center at top + 18px (8px offset + 20px height / 2)
            const profile1PinCenterX = profile1.x + profileCardWidth / 2
            const profile1PinCenterY = profile1.y + 18
            const profile2PinCenterX = profile2.x + profileCardWidth / 2
            const profile2PinCenterY = profile2.y + 18

            // Calculate angle and distance between pins
            const dx = profile2PinCenterX - profile1PinCenterX
            const dy = profile2PinCenterY - profile1PinCenterY
            const angle = Math.atan2(dy, dx)
            const ropeLength = Math.sqrt(dx * dx + dy * dy)

            // Position rope starting at profile1 pin
            const ropeX = profile1PinCenterX
            const ropeY = profile1PinCenterY

            editor.createShape({
              id: ropeId,
              type: 'rope',
              x: ropeX,
              y: ropeY,
              rotation: angle,
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

      // Add a note card with search summary
      const noteId = createShapeId()
      editor.createShape({
        id: noteId,
        type: 'note-card',
        x: 200,
        y: 500,
        props: {
          w: 200,
          h: 150,
          text: `Found ${searchResults.length} potential matches\n\nSearch completed: ${new Date().toLocaleTimeString()}`,
          color: '#ffeb3b',
        },
      })

    } catch (error) {
      console.error('Error processing image:', error)
      
      // Add error note
      const errorNoteId = createShapeId()
      editor.createShape({
        id: errorNoteId,
        type: 'note-card',
        x: 200,
        y: 200,
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
  }, [editor])

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Tldraw 
        shapeUtils={customShapes}
        onMount={(editor) => setEditor(editor)}
      />
      <SearchPanel 
        onImageUpload={handleImageUpload}
        isSearching={isSearching}
      />
    </div>
  )
}