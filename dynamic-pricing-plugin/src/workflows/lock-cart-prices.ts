import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createCartPriceLocksStep } from "./steps/create-cart-price-locks-step"

export type LockCartPricesInput = {
  cartId: string
  force?: boolean
}

export const lockCartPricesWorkflow = createWorkflow(
  "lock-cart-prices",
  function (input: LockCartPricesInput) {
    const result = createCartPriceLocksStep({ cartId: input.cartId, force: input.force })
    return new WorkflowResponse(result)
  }
)
