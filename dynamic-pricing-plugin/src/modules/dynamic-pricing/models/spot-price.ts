import { model } from "@medusajs/framework/utils"

/**
 * Stores a spot price snapshot for a given material at a point in time.
 * Used for both the current price and historical records.
 */
const SpotPrice = model.define("spot_price", {
  id: model.id().primaryKey(),
  /** Material symbol, e.g. "XAU", "XAG" */
  material: model.text(),
  /** Ask price — the price at which the market sells */
  ask: model.bigNumber(),
  /** Bid price — the price at which the market buys */
  bid: model.bigNumber(),
  /** Mid/current price — typically (ask + bid) / 2 */
  price: model.bigNumber(),
})

export default SpotPrice
