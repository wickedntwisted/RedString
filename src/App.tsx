import './App.css'
import { DetectiveBoard } from './components/DetectiveBoard'

import { useEffect } from 'react'

function App() {
  useEffect(() => {
    setTimeout(() => {
      const watermarks = document.querySelectorAll('[class*="tl-watermark"]')
      watermarks.forEach((watermark) => watermark.remove())
    }, 0)
  }, [])

  return <DetectiveBoard />
}

export default App
