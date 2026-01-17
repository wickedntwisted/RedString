//import { useState } from 'react'
import './App.css'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'


function App() {

  return (
    <>
      <div>
        Hello
        <div style={{ position: 'fixed', inset: 0 }}>
	    		<Tldraw />
    		</div>
      </div>
    </>
  )
}

export default App
