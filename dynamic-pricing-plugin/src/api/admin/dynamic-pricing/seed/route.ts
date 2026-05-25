import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { seedProductsWorkflow } from "../../../../workflows/seed-products"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await seedProductsWorkflow(req.scope).run({})
  res.status(201).json(result)
}
