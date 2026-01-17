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

        // Create red rope connection from photo to profile (pending confirmation)
        // Calculate edge-to-edge connection
        const photoPinWidth = 200
        const photoPinHeight = 200
        const profileCardWidth = 280
        const profileCardHeight = 200
        
        // Calculate center points
        const photoCenterX = photoPinX + photoPinWidth / 2
        const photoCenterY = photoPinY + photoPinHeight / 2
        const profileCenterX = profileX + profileCardWidth / 2
        const profileCenterY = profileY + profileCardHeight / 2
        
        // Calculate angle
        const dx = profileCenterX - photoCenterX
        const dy = profileCenterY - photoCenterY
        const angle = Math.atan2(dy, dx)
        
        // Calculate edge intersection points for rectangles
        // For photo pin - find which edge the line intersects
        const photoAspect = Math.abs(Math.tan(angle))
        let photoEdgeX: number, photoEdgeY: number
        if (photoAspect > photoPinHeight / photoPinWidth) {
          // Intersects top or bottom edge
          const sign = dy > 0 ? 1 : -1
          photoEdgeY = photoCenterY + sign * (photoPinHeight / 2)
          photoEdgeX = photoCenterX + (photoEdgeY - photoCenterY) / Math.tan(angle)
        } else {
          // Intersects left or right edge
          const sign = dx > 0 ? 1 : -1
          photoEdgeX = photoCenterX + sign * (photoPinWidth / 2)
          photoEdgeY = photoCenterY + (photoEdgeX - photoCenterX) * Math.tan(angle)
        }
        
        // For profile card - find which edge the line intersects
        const profileAspect = Math.abs(Math.tan(angle))
        let profileEdgeX: number, profileEdgeY: number
        if (profileAspect > profileCardHeight / profileCardWidth) {
          // Intersects top or bottom edge
          const sign = dy < 0 ? 1 : -1
          profileEdgeY = profileCenterY + sign * (profileCardHeight / 2)
          profileEdgeX = profileCenterX + (profileEdgeY - profileCenterY) / Math.tan(angle)
        } else {
          // Intersects left or right edge
          const sign = dx < 0 ? 1 : -1
          profileEdgeX = profileCenterX + sign * (profileCardWidth / 2)
          profileEdgeY = profileCenterY + (profileEdgeX - profileCenterX) * Math.tan(angle)
        }
        
        // Calculate rope length - distance from photo edge to profile edge
        const ropeLength = Math.sqrt(
          Math.pow(profileEdgeX - photoEdgeX, 2) + Math.pow(profileEdgeY - photoEdgeY, 2)
        )
        
        // Position rope starting at the photo edge, pointing toward profile edge
        const ropeX = photoEdgeX
        const ropeY = photoEdgeY

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
            const profileCardHeight = 200
            
            // Calculate center points
            const profile1CenterX = profile1.x + profileCardWidth / 2
            const profile1CenterY = profile1.y + profileCardHeight / 2
            const profile2CenterX = profile2.x + profileCardWidth / 2
            const profile2CenterY = profile2.y + profileCardHeight / 2
            
            // Calculate angle
            const dx = profile2CenterX - profile1CenterX
            const dy = profile2CenterY - profile1CenterY
            const angle = Math.atan2(dy, dx)
            
            // Calculate edge intersection points for rectangles
            const aspect = Math.abs(Math.tan(angle))
            let profile1EdgeX: number, profile1EdgeY: number
            let profile2EdgeX: number, profile2EdgeY: number
            
            if (aspect > profileCardHeight / profileCardWidth) {
              // Intersects top or bottom edge
              const sign1 = dy > 0 ? 1 : -1
              const sign2 = dy < 0 ? 1 : -1
              profile1EdgeY = profile1CenterY + sign1 * (profileCardHeight / 2)
              profile1EdgeX = profile1CenterX + (profile1EdgeY - profile1CenterY) / Math.tan(angle)
              profile2EdgeY = profile2CenterY + sign2 * (profileCardHeight / 2)
              profile2EdgeX = profile2CenterX + (profile2EdgeY - profile2CenterY) / Math.tan(angle)
            } else {
              // Intersects left or right edge
              const sign1 = dx > 0 ? 1 : -1
              const sign2 = dx < 0 ? 1 : -1
              profile1EdgeX = profile1CenterX + sign1 * (profileCardWidth / 2)
              profile1EdgeY = profile1CenterY + (profile1EdgeX - profile1CenterX) * Math.tan(angle)
              profile2EdgeX = profile2CenterX + sign2 * (profileCardWidth / 2)
              profile2EdgeY = profile2CenterY + (profile2EdgeX - profile2CenterX) * Math.tan(angle)
            }
            
            // Calculate rope length - distance from profile1 edge to profile2 edge
            const ropeLength = Math.sqrt(
              Math.pow(profile2EdgeX - profile1EdgeX, 2) + Math.pow(profile2EdgeY - profile1EdgeY, 2)
            )
            
            // Position rope starting at profile1 edge, pointing toward profile2 edge
            const ropeX = profile1EdgeX
            const ropeY = profile1EdgeY

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