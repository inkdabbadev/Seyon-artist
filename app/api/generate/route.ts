import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 min — required for multi-slide image gen

const MODEL_MAP = {
  flash: "gemini-3.1-flash-image-preview",
  pro:   "gemini-3-pro-image-preview",
} as const

const RATIO_MAP: Record<string, string> = {
  "1:1 SQUARE":    "1:1",
  "3:4 PORTRAIT":  "3:4",
  "4:3 LANDSCAPE": "4:3",
  "9:16 SOCIAL":   "9:16",
  "16:9 VIDEO":    "16:9",
}

type ModelKey = keyof typeof MODEL_MAP

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚧 DEBUG FLAG — set to false to re-enable real Gemini calls
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const API_DISABLED = false

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

function isRetryable(msg: string) {
  const m = msg.toLowerCase()
  return (
    m.includes("503") || m.includes("service unavailable") ||
    m.includes("high demand") || m.includes("temporarily") ||
    m.includes("timeout") || m.includes("timed out") ||
    m.includes("429") || m.includes("resource_exhausted") ||
    m.includes("quota") || m.includes("aborted") ||
    m.includes("operation was aborted") || m.includes("fetch failed")
  )
}

function statusFromMessage(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes("invalid api key") || m.includes("api_key")) return 500
  if (m.includes("429") || m.includes("resource_exhausted") || m.includes("quota")) return 429
  if (m.includes("503") || m.includes("service unavailable")) return 503
  if (m.includes("safety") || m.includes("blocked")) return 422
  return 500
}

function friendlyMessage(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes("invalid api key") || m.includes("api_key"))
    return "Invalid or missing Gemini API key."
  if (m.includes("429") || m.includes("resource_exhausted") || m.includes("quota"))
    return "Gemini quota/rate limit hit. Try again in a moment."
  if (m.includes("503") || m.includes("service unavailable") || m.includes("high demand"))
    return "Gemini is under heavy load right now. Try again in a moment."
  if (m.includes("safety") || m.includes("blocked"))
    return "Request blocked by safety filters. Try rephrasing your prompt."
  if (m.includes("timed out") || m.includes("aborted") || m.includes("operation was aborted"))
    return "Generation timed out — Gemini took too long. Try again."
  return msg || "Image generation failed."
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let id: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, rej) => {
    id = setTimeout(() => rej(new Error(`Generation timed out after ${ms / 1000}s`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id))
}

// ── Single Gemini call ────────────────────────────────────────────────────────
async function callGeminiOnce(opts: {
  apiKey:           string
  modelId:          string
  modelKey:         ModelKey
  prompt:           string
  ratio:            string
  inputLayout?:     string | null
  referenceStyles?: string[]
}) {
  const { apiKey, modelId, modelKey, prompt, ratio, inputLayout, referenceStyles } = opts

  const genAI  = new GoogleGenerativeAI(apiKey)
  const gemini = genAI.getGenerativeModel({ model: modelId })

  const parts: any[] = [{ text: prompt }]

  if (inputLayout) {
    const b64 = inputLayout.startsWith("data:") ? inputLayout.split(",")[1] : inputLayout
    parts.push({ inlineData: { mimeType: "image/png", data: b64 } })
  }

  if (Array.isArray(referenceStyles)) {
    referenceStyles.slice(0, 6).forEach((img: string) => {
      const b64 = img.startsWith("data:") ? img.split(",")[1] : img
      parts.push({ inlineData: { mimeType: "image/png", data: b64 } })
    })
  }

  const result = await gemini.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio: ratio,
        imageSize: modelKey === "pro" ? "2K" : "1K",
      },
    } as any,
  } as any)

  const respParts = result.response.candidates?.[0]?.content?.parts ?? []
  const imgPart   = respParts.find((p: any) => p.inlineData?.data)

  if (!imgPart?.inlineData?.data) {
    const textPart = respParts.find((p: any) => p.text)
    console.error("No image returned. Text:", textPart?.text ?? "(none)")
    throw new Error("Model did not return an image (possibly safety blocked).")
  }

  const mimeType = imgPart.inlineData.mimeType ?? "image/png"
  return { imageUrl: `data:${mimeType};base64,${imgPart.inlineData.data}` }
}

// ── Retry + fallback wrapper ──────────────────────────────────────────────────
async function callGemini(args: {
  apiKey:           string
  primaryKey:       ModelKey
  prompt:           string
  ratio:            string
  inputLayout?:     string | null
  referenceStyles?: string[]
}) {
  const { apiKey, primaryKey, prompt, ratio, inputLayout, referenceStyles } = args

  const attempts = [
    { modelKey: primaryKey,   modelId: MODEL_MAP[primaryKey] },
    ...(primaryKey === "pro" ? [{ modelKey: "flash" as const, modelId: MODEL_MAP.flash }] : []),
  ]

  const PER_ATTEMPT_TIMEOUT = 240_000  // 4 min — Gemini image gen can take 2-3 min
  const MAX_RETRIES         = 2

  let lastErr: any = null

  for (const m of attempts) {
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        const result = await withTimeout(
          callGeminiOnce({ apiKey, modelId: m.modelId, modelKey: m.modelKey, prompt, ratio, inputLayout, referenceStyles }),
          PER_ATTEMPT_TIMEOUT,
        )
        return { ...result, usedModelId: m.modelId, usedModelKey: m.modelKey }
      } catch (e: any) {
        lastErr = e
        const msg = e?.message ?? String(e)
        console.warn(`[generate] attempt ${i + 1} failed (${m.modelId}): ${msg}`)
        // Don't retry on timeout — it will just hang again
        const isTimeout = msg.includes("timed out") || msg.includes("aborted")
        if (!isRetryable(msg) || isTimeout) break
        const delay = 800 * Math.pow(2, i) + Math.floor(Math.random() * 300)
        await sleep(delay)
      }
    }
  }

  throw lastErr ?? new Error("Generation failed after all retries.")
}

// ── Build prompt for one slide ────────────────────────────────────────────────
function buildPrompt(opts: {
  expertStyle: string
  notes:       string
  slideIndex:  number
  totalSlides: number
}) {
  const { expertStyle, notes, slideIndex, totalSlides } = opts
  const isCarousel = totalSlides > 1

  return [
    `Generate a single high-quality image with the following creative direction.`,
    `Style: ${expertStyle}`,
    notes ? `Additional direction: ${notes}` : null,
    isCarousel
      ? `This is image ${slideIndex} of ${totalSlides} in a series. Keep visual style consistent across the series while giving this image its own distinct composition.`
      : null,
        `Output must be visually striking with professional composition, rich color, and strong typographic hierarchy if needed.`,
        `Do not add watermarks, borders, or UI chrome.`,
      ]
    .filter(Boolean)
    .join("\n")
}
  
// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const expertStyle:     string      = body?.expertStyle    ?? "Creative Art Director"
    const notes:           string      = body?.notes          ?? ""
    const aspectRatio:     string      = body?.aspectRatio    ?? "1:1 SQUARE"
    const modelKey:        ModelKey    = (body?.model as ModelKey) ?? "flash"
    const slides:          number      = Math.max(1, Math.min(8, Number(body?.slides ?? 1)))
    const inputLayout:     string|null = body?.inputLayout    ?? null
    const referenceStyles: string[]    = Array.isArray(body?.referenceStyles) ? body.referenceStyles : []

    const ratio = RATIO_MAP[aspectRatio] ?? "1:1"

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚧 DEBUG MODE  (API_DISABLED = true)
    //    No Gemini call is made. Logs + returns all received params so you
    //    can verify the frontend is sending the right values.
    //
    //    ✅ To go live: flip  API_DISABLED = false  at the top of this file.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (API_DISABLED) {
      const prompts = Array.from({ length: slides }, (_, i) =>
        buildPrompt({ expertStyle, notes, slideIndex: i + 1, totalSlides: slides })
      )

      const payload = {
        debug: true,
        received: {
          expertStyle,
          notes:          notes || "(empty)",
          aspectRatio,
          ratio,
          model:          modelKey,
          modelId:        MODEL_MAP[modelKey],
          slides,
          hasInputLayout: !!inputLayout,
          referenceCount: referenceStyles.length,
        },
        prompts,
      }

      console.log("🚧 [DEBUG] API disabled — received params:\n", JSON.stringify(payload, null, 2))
      return Response.json(payload, { status: 200 })
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ LIVE MODE  (API_DISABLED = false)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const tasks = Array.from({ length: slides }, (_, i) => {
      const prompt = buildPrompt({ expertStyle, notes, slideIndex: i + 1, totalSlides: slides })
      return callGemini({
        apiKey:         process.env.GEMINI_API_KEY!,
        primaryKey:     modelKey,
        prompt,
        ratio,
        inputLayout,
        referenceStyles,
      })
    })

    const results = await Promise.allSettled(tasks)
    const images: string[] = []
    const errors: string[] = []

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        images.push(r.value.imageUrl)
      } else {
        const msg = r.reason?.message ?? String(r.reason)
        console.error(`Slide ${i + 1} failed:`, msg)
        errors.push(`Slide ${i + 1}: ${friendlyMessage(msg)}`)
      }
    })

    if (images.length === 0) {
      return Response.json(
        { error: errors[0] ?? "All slides failed to generate." },
        { status: statusFromMessage(errors[0] ?? "") }
      )
    }

    return Response.json({
      images,
      model:  MODEL_MAP[modelKey],
      ratio,
      slides: images.length,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    const msg = error?.message ?? String(error)
    console.error("GENERATE ERROR:", msg)
    return Response.json({ error: friendlyMessage(msg) }, { status: statusFromMessage(msg) })
  }
}