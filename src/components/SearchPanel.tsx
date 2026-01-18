import { useState } from 'react'
import './SearchPanel.css'

interface SearchPanelProps {
  onImageUpload: (file: File | string) => void
  isSearching: boolean
}

export function SearchPanel({ onImageUpload, isSearching }: SearchPanelProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0])
      setIsExpanded(false)
      return
    }

    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url) {
      onImageUpload(url)
      setIsExpanded(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0])
      setIsExpanded(false)
    }
  }

  return (
    <>
      {isExpanded ? (
        <div className="search-panel">
          <button
            className="search-panel-toggle"
            onClick={() => setIsExpanded(false)}
            title="Minimize"
          >
            ✕
          </button>
          <div className="search-panel-header">
            <h2>Detective Board</h2>
            <p>Upload a photo to search for profiles</p>
          </div>

          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${isSearching ? 'searching' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isSearching ? (
              <div className="searching-state">
                <div className="spinner"></div>
                <p>Searching for profiles...</p>
              </div>
            ) : (
                <>
                <img
                  src="/public/camera-265.png"
                  alt="Upload Icon"
                  className="upload-icon"
                  style={{ maxWidth: '30%', maxHeight: 'auto', objectFit: 'contain' }}
                />
                <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>Drag & drop an image here</p>
                <p className="upload-subtext" style={{ fontSize: '0.8rem', textAlign: 'center' }}>or</p>
                <label
                  htmlFor="file-input"
                  className="upload-button"
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', textAlign: 'center' }}
                >
                  Browse Files
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                </>
            )}
          </div>

          <div className="search-tips">
            <h3>Tips:</h3>
            <ul>
              <li>Upload clear photos of people</li>
              <li>Results will appear on the board</li>
              <li>Drag items to organize your investigation</li>
            </ul>
          </div>
        </div>
      ) : (
        <button
          className="search-panel-button"
          onClick={() => setIsExpanded(true)}
          title="Upload Image"
        >
          📷
        </button>
      )}
    </>
  )
}
