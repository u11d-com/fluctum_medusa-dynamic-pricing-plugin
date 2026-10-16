/**
 * Parser for UCP cart permalinks (`dev.ucp.shopping.permalink`):
 * `/buy/{token}:{qty},{token}:{qty}` where a token is either a raw identifier
 * matching RAW_TOKEN or `~` + base64url (no padding) of the UTF-8 identifier.
 * https://ucp.dev/2026-08-25/specification/permalink/
 */

const RAW_TOKEN = /^[A-Za-z0-9._-]+$/
const QUANTITY = /^[1-9][0-9]*$/
const MAX_QUANTITY = 1000
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/

export type PermalinkItem = { variantId: string; quantity: number }

function decodeToken(token: string): string | null {
  if (!token.startsWith("~")) {
    return RAW_TOKEN.test(token) ? token : null
  }

  const encoded = token.slice(1)
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    return null
  }

  const bytes = Buffer.from(encoded, "base64url")
  // Reject non-canonical encodings (e.g. stray trailing bits).
  if (bytes.toString("base64url") !== encoded) {
    return null
  }

  try {
    const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return value.length > 0 && !CONTROL_CHARS.test(value) ? value : null
  } catch {
    return null
  }
}

/** Returns the merged line items, or null when the path segment is malformed. */
export function parsePermalinkItems(segment: string): PermalinkItem[] | null {
  const quantities = new Map<string, number>()

  for (const part of segment.split(",")) {
    const separator = part.lastIndexOf(":")
    if (separator <= 0) {
      return null
    }

    const variantId = decodeToken(part.slice(0, separator))
    const quantityText = part.slice(separator + 1)
    if (!variantId || !QUANTITY.test(quantityText)) {
      return null
    }

    const quantity = (quantities.get(variantId) ?? 0) + Number(quantityText)
    if (quantity > MAX_QUANTITY) {
      return null
    }
    quantities.set(variantId, quantity)
  }

  return Array.from(quantities, ([variantId, quantity]) => ({
    variantId,
    quantity,
  }))
}
