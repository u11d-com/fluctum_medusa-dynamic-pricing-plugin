import { LoaderOptions } from "@medusajs/framework/types"
import { resolvePluginOptions } from "../config.js"
import { setPluginOptions } from "../options-store.js"
import type { DynamicPricingOptions } from "../../../types.js"

/**
 * Runs at startup. Validates plugin configuration and stores the resolved
 * options in the module singleton so jobs, workflow steps, and API routes
 * can access them from any container scope.
 */
export default async function dynamicPricingLoader({
  container,
  options,
}: LoaderOptions) {
  const logger = container.resolve("logger")

  const resolved = resolvePluginOptions(options as DynamicPricingOptions)

  // Store in module-level singleton — accessible from any container scope
  setPluginOptions(resolved)

  logger.info(
    `[dynamic-pricing-plugin] Loaded. Materials: ${resolved.materials.join(", ")} | ` +
      `Fetch interval: ${resolved.fetchIntervalSeconds}s | ` +
      `Price lock duration: ${resolved.priceLockDurationSeconds}s | ` +
      `Provider: ${resolved.provider.name || "anonymous"}`
  )
}
