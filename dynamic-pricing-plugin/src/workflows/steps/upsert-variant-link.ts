import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { generateEntityId } from "@medusajs/framework/utils"
import { LINK_TABLE, getLinkKnex } from "./link-table"
import type { LinkRow } from "./link-row"

export type UpsertVariantLinkStepInput = {
  variant_id: string
  pricing_rule_id: string
  material: string
  weight_oz: number | null
}

/**
 * Upserts the variant→pricing-rule link via Knex, bypassing link.create()
 * which rejects re-assignment due to a uniqueness check that counts
 * soft-deleted rows (link.dismiss() soft-deletes, so re-assigning throws).
 *
 * Hard-deletes the existing row then inserts the new one.
 * Compensation restores the previous rows on rollback.
 */
export const upsertVariantLinkStep = createStep(
  "upsert-variant-link",
  async (input: UpsertVariantLinkStepInput, { container }) => {
    const knex = getLinkKnex(container)

    const existing = await knex(LINK_TABLE)
      .select("id", "product_variant_id", "pricing_rule_id", "material", "weight_oz", "created_at")
      .where({ product_variant_id: input.variant_id })

    await knex(LINK_TABLE).where({ product_variant_id: input.variant_id }).delete()

    const now = new Date()
    await knex(LINK_TABLE).insert({
      id: generateEntityId("", "link"),
      product_variant_id: input.variant_id,
      pricing_rule_id: input.pricing_rule_id,
      material: input.material,
      weight_oz: input.weight_oz,

      created_at: now,
      updated_at: now,
      deleted_at: null,
    })

    return new StepResponse(null, existing)
  },
  async (existing: LinkRow[], { container }) => {
    if (!existing?.length) return
    const knex = getLinkKnex(container)
    await knex(LINK_TABLE).where({ product_variant_id: existing[0].product_variant_id }).delete()
    await knex(LINK_TABLE).insert(existing.map((r) => ({ ...r, updated_at: new Date() })))
  }
)
