import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export function DetectiveBoard() {
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
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          console.log('File dropped:', file.name)
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
      <Tldraw />
    </div>
  )
}