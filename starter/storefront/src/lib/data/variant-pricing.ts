"use server"

import { sdk } from "@lib/config"
import type { VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"

export async function getVariantPricingData(
  variantIds: string[]
): Promise<Record<string, VariantPricingData>> {
  if (variantIds.length === 0) return {}

  return sdk.client
    .fetch<{ variants: Record<string, VariantPricingData> }>(
      "/store/dynamic-pricing/variant-pricing",
      {
        method: "GET",
        query: {
          variant_id: variantIds,
        },
        cache: "no-store",
      }
    )
    .then((data) => data.variants)
    .catch(() => ({}))
}
