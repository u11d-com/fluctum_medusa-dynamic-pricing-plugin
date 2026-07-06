# Pricing Formula

## Formula

```
base          = weight_oz × spot_price × spread_factor × currency_conversion
after_premium = base × (1 + premium_percentage / 100)
final_price   = after_premium + spread_fixed + premium_fixed
```

Rounded to 2 decimal places.

## Factors

| Factor | Source | Default | Description |
|---|---|---|---|
| `weight_oz` | Module link (variant attribute) | — | Weight in troy ounces |
| `spot_price` | `SpotPrice.price` from DB | — | Current mid-market spot price for the material |
| `spread_factor` | `PricingRule.spread_factor` | `1` | Multiplicative margin (e.g. `1.02` = 2% spread) |
| `currency_conversion` | Currency rate table | `1` | Conversion from reference currency to display currency |
| `premium_percentage` | `PricingRule.premium_percentage` | `0` | Additional percentage charged after spread |
| `spread_fixed` | `PricingRule.spread_fixed` | `0` | Flat additive charge applied after percentage adjustments |
| `premium_fixed` | `PricingRule.premium_fixed` | `0` | Second flat additive charge (e.g. minting/handling fee) |

## Implementation

The canonical implementation lives in `dynamic-pricing-plugin/src/utils/price-formula.ts`:

```ts
export type PricingFactors = {
  weightOz: number
  spotPrice: number
  spreadFactor: number
  spreadFixed: number
  premiumPercentage: number
  premiumFixed: number
  currencyConversion?: number  // defaults to 1
}

export function computeFinalPrice(factors: PricingFactors): number {
  const {
    weightOz,
    spotPrice,
    spreadFactor,
    spreadFixed,
    premiumPercentage,
    premiumFixed,
    currencyConversion = 1,
  } = factors

  const base = weightOz * spotPrice * spreadFactor * currencyConversion
  const afterPremium = base * (1 + premiumPercentage / 100)
  const final = afterPremium + spreadFixed + premiumFixed

  return Math.round(final * 100) / 100
}
```

This function is exported from both the main plugin entry point and the `./client` subpath, making it safe to import in storefront code without pulling in server-only Medusa dependencies.

## Admin Price Computation

The admin panel mirrors the formula in `admin/components.tsx` using the **ask price** instead of the mid-market `price`:

```ts
function computePrice(rule: PricingRule, weightOz: number, ask: number): number
```

This reflects the business requirement that the displayed "sell" price in the admin is based on the ask (what dealers charge), not the mid-market rate.

## Examples

### 1 oz gold coin, simple spread

```
weight_oz         = 1.0
spot_price        = 2000.00  (XAU mid)
spread_factor     = 1.02     (2% dealer spread)
currency_conv     = 1.0
premium_pct       = 0
spread_fixed      = 0
premium_fixed     = 0

base  = 1.0 × 2000.00 × 1.02 × 1.0 = 2040.00
after = 2040.00 × 1.0               = 2040.00
final = 2040.00 + 0 + 0             = 2040.00
```

### 0.5 oz silver coin, spread + handling fee

```
weight_oz         = 0.5
spot_price        = 25.00   (XAG mid)
spread_factor     = 1.01    (1% spread)
currency_conv     = 1.0
premium_pct       = 0
spread_fixed      = 0
premium_fixed     = 2.50    (minting fee)

base  = 0.5 × 25.00 × 1.01 = 12.625
after = 12.625 × 1.0        = 12.625
final = 12.625 + 0 + 2.50   = 15.13
```

### Gold coin with all factors

```
weight_oz         = 1.0
spot_price        = 2000.00
spread_factor     = 1.02
currency_conv     = 1.08    (USD → EUR)
premium_pct       = 1.5
spread_fixed      = 5.00
premium_fixed     = 10.00

base  = 1.0 × 2000.00 × 1.02 × 1.08 = 2203.20
after = 2203.20 × (1 + 0.015)        = 2236.25
final = 2236.25 + 5.00 + 10.00       = 2251.25
```

## Price Storage

- Spot prices are stored as plain decimal numbers (not cents)
- `CartPriceLock.unit_price` stores the computed final price at lock time
- `CartPriceLock.spot_price` stores the raw spot price used for the computation
- All spread/premium factors are stored on the lock for auditability

## Spot Price Fields

Each `SpotPrice` record has three price fields:

| Field | Meaning |
|---|---|
| `ask` | The price at which dealers sell (higher) |
| `bid` | The price at which dealers buy (lower) |
| `price` | Mid-market price `(ask + bid) / 2` |

The pricing formula uses `price` (mid-market). The admin panel preview uses `ask` (sell-side).
