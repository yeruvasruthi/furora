import express, { Request, Response } from "express"
import fetch from "node-fetch"
import dotenv from "dotenv"
import cors from "cors"
import detect from "detect-port"

dotenv.config()

const app = express()
app.use(cors()) // allow frontend calls

// Types
interface TokenResponse {
  access_token: string
  expires_in: number
}

interface PetfinderResponse {
  animals: any[]
}

// Simple in-memory token cache
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const res = await fetch("https://api.petfinder.com/v2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.PETFINDER_ID ?? "",
      client_secret: process.env.PETFINDER_SECRET ?? "",
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Petfinder token: ${res.statusText}`)
  }

  const data = (await res.json()) as TokenResponse
  cachedToken = data.access_token
  tokenExpiry = now + data.expires_in * 1000
  return cachedToken
}

// Proxy endpoint
app.get("/api/pets", async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken()

    const { type = "dog", limit = "20", location = "10001" } = req.query // default to NYC zip
    const query = new URLSearchParams({
      type: String(type),
      limit: String(limit),
      location: String(location),
    })

    const petRes = await fetch(`https://api.petfinder.com/v2/animals?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!petRes.ok) {
      const text = await petRes.text()
      console.error("Petfinder error:", petRes.status, text)
      return res.status(500).json({ error: "Failed to fetch pets from Petfinder" })
    }

    const pets = await petRes.json()
    res.json(pets)
  } catch (err: any) {
    console.error("Error in /api/pets:", err.message)
    res.status(500).json({ error: err.message || "Server error" })
  }
})

// Only one listen block with auto-port detection
const DEFAULT_PORT: number = Number(process.env.PORT) || 8080

detect(DEFAULT_PORT).then(port => {
  if (port !== DEFAULT_PORT) {
    console.warn(`⚠️ Port ${DEFAULT_PORT} is busy, using ${port} instead`)
  }
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(` Server running at http://localhost:${port}`)
    console.log(` Try: http://localhost:${port}/api/pets`)
  })

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(" Shutting down server...")
    server.close(() => process.exit(0))
  })
})
