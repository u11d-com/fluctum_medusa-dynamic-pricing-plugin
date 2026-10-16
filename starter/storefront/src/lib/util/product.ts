import { HttpTypes } from "@medusajs/types"

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
  return (
    product.options?.length === 1 && product.options[0].values?.length === 1
  )
}

export const isVariantInStock = (
  variant: HttpTypes.StoreProductVariant
): boolean => {
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity ?? 0) > 0
}
