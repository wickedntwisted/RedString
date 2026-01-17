
import { Editor, createShapeId, AssetRecordType } from 'tldraw'
import { toRichText } from '@tldraw/tlschema'

export interface AnalysisResponse {
  labels: string[]
  bestGuesses: string[]
}

// calling the backend
export async function analyzeImage(payload: {
  imageBase64?: string
  imageUrl?: string
}): Promise<AnalysisResponse> {
  const res = await fetch('http://localhost:3001/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error('Gemini failed to analyze')
  return res.json()
}

// Trying to figure out the image
export async function runDetectiveWork(
  editor: Editor,
  point: { x: number; y: number },
  payload: { imageBase64?: string; imageUrl?: string },
  displaySrc: string 
) {
 
  editor.markHistoryStoppingPoint('run-detective')

  try {
    // Gettinng the analysis
    const analysis = await analyzeImage(payload)

    const assetId = AssetRecordType.createId()
    const imageWidth = 400
    const imageHeight = 400

    editor.createAssets([
      {
        id: assetId,
        type: 'image',
        typeName: 'asset',
        props: {
          name: 'evidence',
          src: displaySrc, 
          w: imageWidth,
          h: imageHeight,
          mimeType: 'image/jpeg',
          isAnimated: false,
        },
        meta: {},
      },
    ])

    // Image with found information
    editor.createShapes([
      {
        id: createShapeId(),
        type: 'image',
        x: point.x,
        y: point.y,
        props: { 
          assetId: assetId, 
          w: imageWidth, 
          h: imageHeight 
        },
      },
      {
        id: createShapeId(),
        type: 'note',
        x: point.x + imageWidth + 20,
        y: point.y,
        props: {
          color: 'yellow',
          labelColor: 'black',
          size: 'm',
          font: 'draw',
          fontSizeAdjustment: 0,
          align: 'middle',
          verticalAlign: 'middle',
          growY: 0,
          url: '',
          
          richText: toRichText(
            `🕵️ EVIDENCE FOUND:\n${analysis.bestGuesses[0] || 'Unknown Object'}`,
          ),
          scale: 1,
        },
      }
    ])
  } catch (error) {
    console.error("Not working:", error)
    
  }
}