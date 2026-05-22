import { useQuery } from "@tanstack/react-query"
import { sdk } from "./lib/client"
import type { PricingRulesListResponse, ConfigResponse, VariantAssignment } from "./types"

export function useRules(enabled: boolean) {
  return useQuery<PricingRulesListResponse>({
    queryKey: ["dynamic-pricing-rules-all"],
    queryFn: () =>
      sdk.client.fetch<PricingRulesListResponse>(
        "/admin/dynamic-pricing/pricing-rules?limit=200"
      ),
    enabled,
  })
}

export function useMaterials(enabled: boolean) {
  return useQuery<ConfigResponse>({
    queryKey: ["dynamic-pricing-config"],
    queryFn: () =>
      sdk.client.fetch<ConfigResponse>("/admin/dynamic-pricing/config"),
    enabled,
    staleTime: Infinity,
  })
}

export function useVariantRule(variantId: string) {
  return useQuery<VariantAssignment>({
    queryKey: ["variant-pricing-rule", variantId],
    queryFn: () =>
      sdk.client.fetch<VariantAssignment>(
        `/admin/dynamic-pricing/variants/${variantId}/pricing-rule`
      ),
  })
}
