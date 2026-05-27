import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DYNAMIC_PRICING_MODULE } from "../../../../modules/dynamic-pricing"
import DynamicPricingModuleService from "../../../../modules/dynamic-pricing/service"
import { LINK_TABLE } from "../../../../workflows/steps/link-table"
import { createSimpleCache } from "../../../../utils/cache"

type LinkRow = {
  product_variant_id: string
  material: string
  weight_oz: number
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

const cache = createSimpleCache<LinkRow[]>(60_000)

/**
 * GET /store/dynamic-pricing/variant-pricing?variant_id=<id>&variant_id=<id>
 *
 * Returns pricing data (material, weight_oz, rule factors) for one or more
 * product variants by querying the link + pricing_rule tables.
 *
 * Accepts variant_id as a repeated query param, a comma-separated string,
 * or qs-style variant_id[0]=...&variant_id[1]=...
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const raw = req.query.variant_id
  let variantIds: string[] = []

  if (Array.isArray(raw)) {
    variantIds = raw.filter((v): v is string => typeof v === "string")
  } else if (typeof raw === "string") {
    // Comma-separated fallback
    variantIds = raw.split(",").map((s) => s.trim()).filter(Boolean)
  } else if (raw && typeof raw === "object") {
    // qs-style variant_id[0]=xxx&variant_id[1]=yyy comes through as an object
    variantIds = Object.values(raw).filter((v): v is string => typeof v === "string")
  }

  if (variantIds.length === 0) {
    return res.status(400).json({ error: "At least one variant_id is required" })
  }

  // In-memory cache: load all link+rule rows once, filter in-memory
  const cached = cache.get()
  const allRows: LinkRow[] = cached ?? await (async () => {
    const service = req.scope.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const knex = service.getKnex()

    const rows = await knex(LINK_TABLE)
      .join("pricing_rule", `${LINK_TABLE}.pricing_rule_id`, "pricing_rule.id")
      .whereNull(`${LINK_TABLE}.deleted_at`)
      .select(
        `${LINK_TABLE}.product_variant_id`,
        `${LINK_TABLE}.material`,
        `${LINK_TABLE}.weight_oz`,
        "pricing_rule.spread_factor",
        "pricing_rule.spread_fixed",
        "pricing_rule.premium_percentage",
        "pricing_rule.premium_fixed"
      )

    cache.set(rows)
    return rows
  })()

  const variantSet = new Set(variantIds)

  const variants: Record<string, unknown> = {}
  for (const row of allRows) {
    if (variantSet.has(row.product_variant_id)) {
      variants[row.product_variant_id] = {
        material: row.material,
        weight_oz: Number(row.weight_oz),
        spread_factor: Number(row.spread_factor),
        spread_fixed: Number(row.spread_fixed),
        premium_percentage: Number(row.premium_percentage),
        premium_fixed: Number(row.premium_fixed),
      }
    }
  }

  res.json({ variants })
}
