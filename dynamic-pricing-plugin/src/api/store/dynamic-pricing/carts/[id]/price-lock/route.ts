import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { lockCartPricesWorkflow } from "../../../../../../workflows/lock-cart-prices"
import { isString } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id as string
  const force = isString(req.query.force) ? req.query.force === "true" : false

  const { result } = await lockCartPricesWorkflow(req.scope).run({
    input: { cartId, force },
  })

  res.json(result)
}
