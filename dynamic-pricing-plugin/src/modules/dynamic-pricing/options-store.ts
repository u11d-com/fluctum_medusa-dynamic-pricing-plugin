import type { ResolvedDynamicPricingOptions } from "../../types"

/**
 * Module-level singleton holding the resolved plugin options.
 *
 * Set once by the module loader at startup. All other plugin code
 * (jobs, workflow steps, API routes) reads from here since they may
 * run in the global container where module-scoped registrations aren't
 * visible.
 */
let _options: ResolvedDynamicPricingOptions | null = null

export function setPluginOptions(opts: ResolvedDynamicPricingOptions): void {
  _options = opts
}

export function getPluginOptions(): ResolvedDynamicPricingOptions {
  if (!_options) {
    throw new Error(
      "[dynamic-pricing-plugin] Plugin options have not been initialised. " +
        "Ensure the dynamicPricing module is registered in medusa-config.ts."
    )
  }
  return _options
}
