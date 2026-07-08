import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const upstreamUrl = `${baseUrl}/store/dynamic-pricing/sse`
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  }
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }

  const abort = new AbortController()
  req.signal.addEventListener("abort", () => abort.abort(), { once: true })

  const upstreamRes = await fetch(upstreamUrl, { headers, signal: abort.signal })

  if (!upstreamRes.ok) {
    return new Response(`SSE upstream error: ${upstreamRes.status}`, { status: 502 })
  }

  const readable = upstreamRes.body
  if (!readable) {
    return new Response("No body from upstream", { status: 502 })
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
