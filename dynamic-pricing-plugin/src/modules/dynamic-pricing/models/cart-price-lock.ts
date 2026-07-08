import { model } from "@medusajs/framework/utils"

const CartPriceLock = model.define("cart_price_lock", {
  id: model.id().primaryKey(),
  cart_id: model.text(),
  variant_id: model.text(),
  material: model.text(),
  weight_oz: model.bigNumber().nullable(),
  unit_price: model.bigNumber(),
  quantity: model.bigNumber(),
  spot_price: model.bigNumber(),
  spread_factor: model.bigNumber(),
  spread_fixed: model.bigNumber(),
  premium_percentage: model.bigNumber(),
  premium_fixed: model.bigNumber(),
  locked_at: model.dateTime(),
  expires_at: model.dateTime(),
  currency_code: model.text(),
  conversion_rate: model.bigNumber(),
})

export default CartPriceLock
