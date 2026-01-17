import React, { useState } from 'react'
import { Tldraw, Editor } from 'tldraw'
import { runDetectiveWork } from './useImageAnalysis'
import 'tldraw/tldraw.css' 

export function DetectiveBoard() {
  
  const [editor, setEditor] = useState<Editor | null>(null)

  const handleDrop = async (e: React.DragEvent) => {
    if (!editor) return

    const dataTransfer = e.dataTransfer
    const imageUrl =
      dataTransfer.getData('text/uri-list') ||
      dataTransfer.getData('text/plain')

    // Helping with tldraw error
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      e.preventDefault()
      e.stopPropagation()

      const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
      const apiBase64 = imageUrl.replace(/^data:image\/\w+;base64,/, '')

      await runDetectiveWork(editor, point, { imageBase64: apiBase64 }, imageUrl)
      return
    }

    const files = dataTransfer.files
    if (files && files.length > 0) {
      e.preventDefault()
      e.stopPropagation()

      const file = files[0]

      // Only process images
      if (!file.type.startsWith('image/')) return

      const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
      const reader = new FileReader()
      reader.onload = async () => {
        const fullBase64 = reader.result as string
        const apiBase64 = fullBase64.split(',')[1]

        await runDetectiveWork(
          editor,
          point,
          { imageBase64: apiBase64 },
          fullBase64,
        )
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      onDropCapture={handleDrop}
      onDragOverCapture={(e) => {  
        e.preventDefault()
      }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Tldraw
        onMount={(editorInstance) => setEditor(editorInstance)}
        autoFocus
      />
    </div>
  )
}