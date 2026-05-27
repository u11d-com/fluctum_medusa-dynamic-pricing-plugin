"use server"

export type VariantPricingData = {
  material: string
  weight_oz: number
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export async function getVariantPricingData(
  variantIds: string[]
): Promise<Record<string, VariantPricingData>> {
  if (variantIds.length === 0) return {}

  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const params = new URLSearchParams()
  for (const id of variantIds) {
    params.append("variant_id", id)
  }

  const url = `${baseUrl}/store/dynamic-pricing/variant-pricing?${params.toString()}`

  const headers: Record<string, string> = {}
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }

  console.log("[getVariantPricingData] fetching", url, "for", variantIds.length, "variants")

  const res = await fetch(url, { headers, cache: "no-store" })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.log("[getVariantPricingData] HTTP", res.status, text)
    return {}
  }

  const data: { variants: Record<string, VariantPricingData> } = await res.json()
  console.log("[getVariantPricingData] got data for", Object.keys(data.variants).length, "variants")
  return data.variants
}
