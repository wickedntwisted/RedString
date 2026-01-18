import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useRef } from 'react'

async function uploadImageToFlask(file: File): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('http://localhost:5000/api/upload-image', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    if (data.success) {
      console.log('Image uploaded:', data.url)
      return data.url
    } else {
      console.error('Error uploading to Flask server:', data.error)
      return null
    }
  } catch (error) {
    console.error('Upload to Flask server failed:', error)
    return null
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
        await uploadImageToFlask(file)
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