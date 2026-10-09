import { MedusaService, ContainerRegistrationKeys, generateEntityId } from "@medusajs/framework/utils"
import { SqlEntityManager } from "@mikro-orm/knex"
import { Knex } from "knex"
import SpotPrice from "./models/spot-price"
import PricingRule from "./models/pricing-rule"
import CartPriceLock from "./models/cart-price-lock"
import CurrencyRate from "./models/currency-rate"
import { getPluginOptions } from "./options-store"

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

  /**
   * Latest spot price per material.
   *
   * Uses one LIMIT 1 index probe per material (LATERAL join over
   * IDX_spot_price_material_created_at) instead of `DISTINCT ON`, which has to
   * walk the whole index. spot_price is append-only and grows by
   * `materials.length` rows every fetch interval, so DISTINCT ON degrades
   * linearly with table age and eventually exhausts the connection pool.
   */
  async getLatestSpotPrices(materials?: string[]): Promise<SpotPriceRow[]> {
    const symbols = materials && materials.length > 0 ? materials : getPluginOptions().materials
    if (symbols.length === 0) return []

    const knex = this.manager_.getKnex()
    const { rows } = await knex.raw<{ rows: SpotPriceRow[] }>(
      `SELECT sp.*
         FROM unnest(?::text[]) AS m(material)
         CROSS JOIN LATERAL (
           SELECT *
             FROM spot_price
            WHERE spot_price.material = m.material
              AND spot_price.deleted_at IS NULL
            ORDER BY spot_price.created_at DESC
            LIMIT 1
         ) sp`,
      [symbols]
    )

    return rows.map((row) => ({
      ...row,
      price: Number(row.price),
      ask: Number(row.ask),
      bid: Number(row.bid),
    }))
  }

  /**
   * Thins out spot price history (downsampling). Keeps:
   *   - every row from the last 24 hours,
   *   - the latest row per material per hour for 24 h – 30 days,
   *   - the latest row per material per day for anything older.
   *
   * Idempotent: re-running only removes rows that crossed a tier boundary
   * since the last run. The tier flag is part of the partition key so an hour
   * bucket and a day bucket starting at the same midnight never merge.
   *
   * Returns the number of deleted rows.
   */
  async pruneSpotPrices(): Promise<number> {
    const knex = this.manager_.getKnex()
    const result = await knex.raw<{ rowCount: number | null }>(
      `DELETE FROM spot_price
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
                   row_number() OVER (
                     PARTITION BY material,
                                  created_at < now() - interval '30 days',
                                  date_trunc(
                                    CASE WHEN created_at < now() - interval '30 days' THEN 'day' ELSE 'hour' END,
                                    created_at
                                  )
                     ORDER BY deleted_at NULLS FIRST, created_at DESC
                   ) AS rn
              FROM spot_price
             WHERE created_at < now() - interval '24 hours'
          ) ranked
          WHERE rn > 1
        )`
    )
    return result.rowCount ?? 0
  }

  async deleteCartPriceLocksByCart(cartId: string): Promise<void> {
    const knex = this.manager_.getKnex()
    await knex("cart_price_lock").where("cart_id", cartId).delete()
  }

  /**
   * Latest rate per (fromCurrency → toCurrency) pair. Same LATERAL index-probe
   * strategy as getLatestSpotPrices (IDX_currency_rate_pair_created_at).
   * Defaults to the configured `currencyConversion.targetCurrencies`.
   */
  async getLatestRates(fromCurrency: string, toCurrencies?: string[]): Promise<CurrencyRateRow[]> {
    const targets = toCurrencies && toCurrencies.length > 0
      ? toCurrencies
      : getPluginOptions().currencyConversion?.targetCurrencies ?? []
    if (targets.length === 0) return []

    const knex = this.manager_.getKnex()
    const { rows } = await knex.raw<{ rows: CurrencyRateRow[] }>(
      `SELECT cr.*
         FROM unnest(?::text[]) AS t(to_currency)
         CROSS JOIN LATERAL (
           SELECT *
             FROM currency_rate
            WHERE currency_rate.from_currency = ?
              AND currency_rate.to_currency = t.to_currency
              AND currency_rate.deleted_at IS NULL
            ORDER BY currency_rate.created_at DESC
            LIMIT 1
         ) cr`,
      [targets, fromCurrency]
    )

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
