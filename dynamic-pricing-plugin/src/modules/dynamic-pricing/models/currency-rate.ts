import { model } from "@medusajs/framework/utils"

const CurrencyRate = model.define("currency_rate", {
  id: model.id().primaryKey(),
  /** Source currency code (ISO-4217 uppercase), e.g. "USD" */
  from_currency: model.text(),
  /** Target currency code (ISO-4217 uppercase), e.g. "PLN" */
  to_currency: model.text(),
  /** Conversion rate: 1 unit of from_currency = rate units of to_currency */
  rate: model.bigNumber(),
})

export default CurrencyRate
