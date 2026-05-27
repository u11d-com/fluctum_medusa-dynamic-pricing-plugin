export type SpotPricePayload = {
  material: string
  price: number
  ask: number
  bid: number
  timestamp: string
}

export type SpotPriceResponse = {
  spot_prices: SpotPricePayload[]
}
