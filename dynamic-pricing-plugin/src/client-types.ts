export type SpotPricePayload = {
  material: string
  price: number
  ask: number
  bid: number
  timestamp: string
}

export type VariantPricingData = {
  material: string
  weight_oz: number
  spread_factor: number
  spread_fixed: number
  premium_percentage: number
  premium_fixed: number
}

export type CartItemPrice = {
  unit_price: number
  total: number
}

export type LockedPriceMap = Record<string, CartItemPrice>

export type LockPricesResult = {
  locks: {
    variant_id: string
    unit_price: number
    quantity: number
    material: string
  }[]
  expires_at: string
}
