import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import cors from 'cors'
import axios from 'axios'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Getting Gemini
const geminiKey = process.env.GEMINI_API_KEY
console.log('Gemini key loaded:', !!geminiKey)
// if not connecting
if (!geminiKey) {
  throw new Error('Missing GEMINI_API_KEY.')
}
const genAI = new GoogleGenerativeAI(geminiKey)
let cachedModelName = null

// Getting the right model
async function resolveModelName() {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL
  if (cachedModelName) return cachedModelName

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
  const { data } = await axios.get(url)
  const models = data.models || []
  const candidates = models.filter((m) =>
    (m.supportedGenerationMethods || m.supportedMethods || []).includes(
      'generateContent',
    ),
  )
  const preferred =
    candidates.find((m) => /vision/i.test(m.name)) || candidates[0]

  if (!preferred) {
    const available = models.map((m) => m.name).join(', ')
    throw new Error(`No generateContent model available. Models: ${available}`)
  }

  cachedModelName = preferred.name.replace(/^models\//, '')
  console.log('Using Gemini model:', cachedModelName)
  return cachedModelName
}

// Helper function to convert image to Gemini's format
async function getImagePart(imageBase64, imageUrl) {
  if (imageBase64) {
    return { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
  }
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
  const base64 = Buffer.from(response.data).toString('base64')
  return { inlineData: { data: base64, mimeType: "image/jpeg" } }
}

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, imageUrl } = req.body
    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const imagePart = await getImagePart(imageBase64, imageUrl)

    // Using prompt for Gemini
    const prompt = `
      Analyze this image and return a JSON object with:
      - labels: (array of strings) descriptive tags
      - text: (string) all OCR text found
      - landmarks: (array of strings) any famous places
      - safeSearch: { adult: string, violence: string, racy: string } 
        (ratings: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY)
      - description: (string) a best guess label for the image
    `

    const modelName = await resolveModelName()
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    })
    const result = await model.generateContent([prompt, imagePart])
    const rawText = result.response.text()
    let response
    try {
      response = JSON.parse(rawText)
    } catch (parseErr) {
      console.error('Gemini JSON parse error:', parseErr)
      console.error('Gemini raw response:', rawText)
      return res.status(500).json({ error: 'Gemini returned invalid JSON' })
    }

    // analysis structure
    const analysis = {
      labels: response.labels || [],
      webEntities: [], 
      bestGuesses: [response.description],
      pagesWithImages: [], 
      text: response.text || '',
      landmarks: response.landmarks || [],
      safeSearch: response.safeSearch || {}
    }

    res.json(analysis)
  } catch (err) {
    console.error('Gemini error:', err)
    res.status(500).json({ error: 'Failed to analyze image', detail: String(err) })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})