import './App.css'
import { DetectiveBoard } from './components/DetectiveBoard'

import { useEffect } from 'react'

function App() {
  useEffect(() => {
    setTimeout(() => {
      const watermark = document.querySelector('.tl-watermark_SEE-LICENSE')
      if (watermark) {
        watermark.remove()
      }
    }, 0)
  }, [])

  return <DetectiveBoard />
}

export default App
