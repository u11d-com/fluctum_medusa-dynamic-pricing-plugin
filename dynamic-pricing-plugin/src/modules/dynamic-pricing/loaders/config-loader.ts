import { LoaderOptions } from "@medusajs/framework/types"
import { resolvePluginOptions } from "../config.js"
import type { DynamicPricingOptions } from "../../../types.js"

/**
 * Runs at startup. Validates plugin configuration and stores the resolved
 * options on the module container for use by jobs, workflows, and routes.
 */
export default async function dynamicPricingLoader({
  container,
  options,
}: LoaderOptions) {
  const logger = container.resolve("logger")

  const resolved = resolvePluginOptions(options as DynamicPricingOptions)

  // Store resolved options so other parts of the plugin can access them
  container.register(
    "dynamicPricingOptions",
    {
      resolve: () => resolved,
    } as any
  )

  logger.info(
    `[dynamic-pricing-plugin] Loaded. Materials: ${resolved.materials.join(", ")} | ` +
      `Fetch interval: ${resolved.fetchIntervalSeconds}s | ` +
      `Price lock duration: ${resolved.priceLockDurationSeconds}s | ` +
      `Provider: ${resolved.provider.name || "anonymous"}`
  )
}
