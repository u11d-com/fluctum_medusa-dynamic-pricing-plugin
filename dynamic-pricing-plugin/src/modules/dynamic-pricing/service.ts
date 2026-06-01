import { MedusaService, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SqlEntityManager } from "@mikro-orm/knex"
import { Knex } from "knex"
import SpotPrice from "./models/spot-price"
import PricingRule from "./models/pricing-rule"
import CartPriceLock from "./models/cart-price-lock"

type SpotPriceRow = {
  id: string
  material: string
  price: number
  ask: number
  bid: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

type ServiceContainer = {
  [ContainerRegistrationKeys.MANAGER]: SqlEntityManager
}

class DynamicPricingModuleService extends MedusaService({
  SpotPrice,
  PricingRule,
  CartPriceLock,
}) {
  private readonly manager_: SqlEntityManager

  constructor(container: ServiceContainer) {
    super(container as Record<string, unknown>)
    this.manager_ = container[ContainerRegistrationKeys.MANAGER]
  }

  getKnex(): Knex {
    return this.manager_.getKnex()
  }

  async getLatestSpotPrices(materials?: string[]): Promise<SpotPriceRow[]> {
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

    const rows: SpotPriceRow[] = await query

    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      ask: Number(row.ask),
      bid: Number(row.bid),
    }))
  }

  async deleteCartPriceLocksByCart(cartId: string): Promise<void> {
    const knex = this.manager_.getKnex()
    await knex("cart_price_lock").where("cart_id", cartId).delete()
  }
}

export default DynamicPricingModuleService
