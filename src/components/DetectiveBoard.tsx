import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useRef } from 'react'

// Helper function to save image to Vultr DB via Flask server
async function saveImageToVultr(imageUrl: string): Promise<number | null> {
  try {
    const response = await fetch('http://localhost:5000/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl })
    })
    
    const data = await response.json()
    if (data.success) {
      console.log('Image stored in Vultr DB with ID:', data.image_id)
      return data.image_id
    } else {
      console.error('Error saving to Vultr DB:', data.error)
      return null
    }
  } catch (error) {
    console.error('Upload to Vultr DB failed:', error)
    return null
  }
}

// Component to track assets and save to Vultr DB
function AssetTracker() {
  const editor = useEditor()
  const savedAssets = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    if (!editor) return

    // Check for new assets periodically
    const checkAssets = () => {
      const assets = editor.getAssets()
      assets.forEach(async (asset) => {
        // Only process image assets that haven't been saved yet
        if (asset.type === 'image' && asset.props.src && !savedAssets.current.has(asset.id)) {
          const imageUrl = asset.props.src
          // Check if it's a data URL (base64) or regular URL
          if (imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
            savedAssets.current.add(asset.id)
            // Save to Vultr DB via Flask server
            await saveImageToVultr(imageUrl)
          }
        }
      })
    }

    // Check immediately and then periodically
    checkAssets()
    const interval = setInterval(checkAssets, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [editor])

  return null
}

export function DetectiveBoard() {
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
        
        const reader = new FileReader()
        reader.onload = async (event) => {
          const imageUrl = event.target?.result as string
          console.log('File dropped:', file.name)
          
          // Save to Vultr DB via Flask server when image is dropped
          await saveImageToVultr(imageUrl)
        }
        reader.readAsDataURL(file)
      })
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Tldraw>
        <AssetTracker />
      </Tldraw>
    </div>
  )
}