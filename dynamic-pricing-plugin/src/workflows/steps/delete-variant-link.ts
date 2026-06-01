import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LINK_TABLE, getLinkKnex } from "./link-table"
import type { LinkRow } from "./link-row"

export type DeleteVariantLinkStepInput = {
  variant_id: string
}

export const deleteVariantLinkStep = createStep(
  "delete-variant-link",
  async (input: DeleteVariantLinkStepInput, { container }) => {
    const knex = getLinkKnex(container)

    const existing = await knex(LINK_TABLE)
      .select("id", "product_variant_id", "pricing_rule_id", "material", "weight_oz", "created_at")
      .where({ product_variant_id: input.variant_id })

    await knex(LINK_TABLE).where({ product_variant_id: input.variant_id }).delete()

    return new StepResponse(null, existing)
  },
  async (existing: LinkRow[], { container }) => {
    if (!existing?.length) return
    const knex = getLinkKnex(container)
    await knex(LINK_TABLE).insert(existing.map((r) => ({ ...r, updated_at: new Date() })))
  }
)
