import { MedusaService, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { EntityManager } from "@mikro-orm/knex"
import SpotPrice from "./models/spot-price"

class DynamicPricingModuleService extends MedusaService({
  SpotPrice,
}) {
  private readonly manager_: EntityManager

  constructor(container: Record<string, unknown>) {
    super(container)
    this.manager_ = container[ContainerRegistrationKeys.MANAGER] as EntityManager
  }

  /**
   * Returns the most recent SpotPrice row for each distinct material using a
   * single DISTINCT ON query.
   *
   * With the composite (material, created_at DESC) index this is an
   * index-only scan — O(distinct materials), not O(total rows).
   */
  async getLatestSpotPrices(materials?: string[]): Promise<Record<string, unknown>[]> {
    const knex = this.manager_.getKnex()

    let query = knex
      .select("*")
      .from(
        knex
          .select(knex.raw("DISTINCT ON (material) *"))
          .from("spot_price")
          .whereNull("deleted_at")
          .orderByRaw("material, created_at DESC")
          .as("latest")
      )

    if (materials && materials.length > 0) {
      query = query.whereIn("material", materials)
    }

    const rows: Record<string, unknown>[] = await query

    // Knex returns numeric columns as strings from PostgreSQL
    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      ask: Number(row.ask),
      bid: Number(row.bid),
    }))
  }
}

export default DynamicPricingModuleService
