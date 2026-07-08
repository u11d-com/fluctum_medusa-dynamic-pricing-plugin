import { MedusaService, ContainerRegistrationKeys, generateEntityId } from "@medusajs/framework/utils"
import { SqlEntityManager } from "@mikro-orm/knex"
import { Knex } from "knex"
import SpotPrice from "./models/spot-price"
import PricingRule from "./models/pricing-rule"
import CartPriceLock from "./models/cart-price-lock"
import CurrencyRate from "./models/currency-rate"

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

type CurrencyRateRow = {
  id: string
  from_currency: string
  to_currency: string
  rate: number
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
  CurrencyRate,
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

  async getLatestRates(fromCurrency: string, toCurrencies?: string[]): Promise<CurrencyRateRow[]> {
    const knex = this.manager_.getKnex()

    let query = knex
      .select("*")
      .from(
        knex
          .select(knex.raw("DISTINCT ON (from_currency, to_currency) *"))
          .from("currency_rate")
          .whereNull("deleted_at")
          .where("from_currency", fromCurrency)
          .orderByRaw("from_currency, to_currency, created_at DESC")
          .as("latest")
      )

    if (toCurrencies && toCurrencies.length > 0) {
      query = query.whereIn("to_currency", toCurrencies)
    }

    const rows: CurrencyRateRow[] = await query

    return rows.map((row) => ({ ...row, rate: Number(row.rate) }))
  }

  async bulkCreateRates(
    rows: Array<{ from_currency: string; to_currency: string; rate: number }>
  ): Promise<void> {
    if (rows.length === 0) return
    const knex = this.manager_.getKnex()
    const rawNum = (v: number) => JSON.stringify({ value: String(v), precision: 20 })
    const now = new Date()
    const records = rows.map((r) => ({
      id: generateEntityId(undefined, "crate"),
      from_currency: r.from_currency,
      to_currency: r.to_currency,
      rate: r.rate,
      raw_rate: rawNum(r.rate),
      created_at: now,
      updated_at: now,
    }))
    await knex("currency_rate").insert(records)
  }
}

export default DynamicPricingModuleService
