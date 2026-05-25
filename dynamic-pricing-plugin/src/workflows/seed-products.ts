import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import DynamicPricingModuleService from "../modules/dynamic-pricing/service"
import { DYNAMIC_PRICING_MODULE } from "../modules/dynamic-pricing"
import { getLinkKnex, LINK_TABLE } from "./steps/link-table"
import { generateEntityId } from "@medusajs/framework/utils"

// ── Seed data ──────────────────────────────────────────────────────────────────

type SeedVariant = {
  title: string
  weight_oz: number
}

type SeedProduct = {
  title: string
  subtitle: string
  material: "XAU" | "XAG"
  /** Multiple variants → single product with Size option. Single variant with title "Default" → no option. */
  variants: SeedVariant[]
}

const SEED_PRODUCTS: SeedProduct[] = [
  // ── Gold coins ──
  {
    title: "American Gold Eagle",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    variants: [
      { title: "1/10 oz", weight_oz: 0.1 },
      { title: "1/4 oz", weight_oz: 0.25 },
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
    ],
  },
  {
    title: "American Gold Buffalo",
    subtitle: "US Mint, 99.99% pure gold",
    material: "XAU",
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Canadian Gold Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    variants: [
      { title: "1/10 oz", weight_oz: 0.1 },
      { title: "1/4 oz", weight_oz: 0.25 },
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
    ],
  },
  {
    title: "South African Gold Krugerrand",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    variants: [
      { title: "1/10 oz", weight_oz: 0.1 },
      { title: "1/4 oz", weight_oz: 0.25 },
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
    ],
  },
  // ── Gold Britannia — one product per denomination (single-variant pattern) ──
  {
    title: "Gold Britannia 1/10 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    variants: [{ title: "Default", weight_oz: 0.1 }],
  },
  {
    title: "Gold Britannia 1/4 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    variants: [{ title: "Default", weight_oz: 0.25 }],
  },
  {
    title: "Gold Britannia 1/2 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    variants: [{ title: "Default", weight_oz: 0.5 }],
  },
  {
    title: "Gold Britannia 1 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    variants: [{ title: "Default", weight_oz: 1 }],
  },
  // ── Gold bars ──
  {
    title: "PAMP Suisse Gold Bar",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    variants: [
      { title: "1 g", weight_oz: 0.03215 },
      { title: "5 g", weight_oz: 0.16075 },
      { title: "10 g", weight_oz: 0.3215 },
      { title: "1 oz", weight_oz: 1 },
      { title: "100 g", weight_oz: 3.215 },
    ],
  },
  {
    title: "Royal Canadian Mint Gold Bar",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    variants: [
      { title: "1 oz", weight_oz: 1 },
      { title: "10 oz", weight_oz: 10 },
    ],
  },
  // ── Silver coins ──
  {
    title: "American Silver Eagle",
    subtitle: "US Mint bullion coin, 99.9% pure silver",
    material: "XAG",
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Canadian Silver Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure silver",
    material: "XAG",
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Austrian Silver Philharmonic",
    subtitle: "Austrian Mint, 99.9% pure silver",
    material: "XAG",
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Silver Britannia",
    subtitle: "The Royal Mint UK, 99.9% pure silver",
    material: "XAG",
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Mexican Silver Libertad",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    variants: [
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
      { title: "2 oz", weight_oz: 2 },
      { title: "5 oz", weight_oz: 5 },
    ],
  },
  // ── Silver bars ──
  {
    title: "PAMP Suisse Silver Bar",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    variants: [
      { title: "1 oz", weight_oz: 1 },
      { title: "5 oz", weight_oz: 5 },
      { title: "10 oz", weight_oz: 10 },
    ],
  },
  {
    title: "Valcambi Silver Bar",
    subtitle: "Valcambi Suisse, 99.9% pure silver",
    material: "XAG",
    variants: [
      { title: "1 oz", weight_oz: 1 },
      { title: "10 oz", weight_oz: 10 },
      { title: "100 oz", weight_oz: 100 },
    ],
  },
]

// ── Step ───────────────────────────────────────────────────────────────────────

const seedProductsStep = createStep(
  "seed-products-step",
  async (_input: Record<string, never>, { container }) => {
    const productModule = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const dynamicPricingModule = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const knex = getLinkKnex(container)

    // Create one default pricing rule per material (spread factor 1, no premiums)
    const [goldRule] = await dynamicPricingModule.createPricingRules([{
      name: "Gold Standard",
      spread_factor: 1.015,
      spread_fixed: 0,
      premium_percentage: 0,
      premium_fixed: 0,
    }])

    const [silverRule] = await dynamicPricingModule.createPricingRules([{
      name: "Silver Standard",
      spread_factor: 1.02,
      spread_fixed: 0,
      premium_percentage: 0,
      premium_fixed: 0,
    }])

    const ruleByMaterial: Record<"XAU" | "XAG", typeof goldRule> = {
      XAU: goldRule,
      XAG: silverRule,
    }

    const createdProducts: string[] = []

    for (const seed of SEED_PRODUCTS) {
      const rule = ruleByMaterial[seed.material]

      const isDefaultVariant =
        seed.variants.length === 1 && seed.variants[0].title === "Default"

      const [product] = await productModule.createProducts([{
        title: seed.title,
        subtitle: seed.subtitle,
        status: "published",
        options: isDefaultVariant ? [] : [{ title: "Size", values: seed.variants.map((v) => v.title) }],
        variants: seed.variants.map((v) => ({
          title: v.title,
          manage_inventory: false,
          options: isDefaultVariant ? undefined : { Size: v.title },
          prices: [],
        })),
      }])

      // Fetch back with variants to get variant IDs
      const [productWithVariants] = await productModule.listProducts(
        { id: [product.id] },
        { relations: ["variants"] }
      )

      // Link each variant to the pricing rule with weight
      const now = new Date()
      const linkRows = (productWithVariants.variants ?? []).map((variant) => {
        const seedVariant = seed.variants.find((sv) => sv.title === variant.title)
        return {
          id: generateEntityId("", "link"),
          product_variant_id: variant.id,
          pricing_rule_id: rule.id,
          material: seed.material,
          weight_oz: seedVariant?.weight_oz ?? null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        }
      })

      if (linkRows.length > 0) {
        await knex(LINK_TABLE).insert(linkRows)
      }

      createdProducts.push(product.title)
    }

    return new StepResponse({
      success: true,
      created_products: createdProducts,
      pricing_rules: [goldRule.name, silverRule.name],
    })
  }
)

// ── Workflow ───────────────────────────────────────────────────────────────────

export const seedProductsWorkflow = createWorkflow(
  "seed-products",
  function () {
    const result = seedProductsStep({} as Record<string, never>)
    return new WorkflowResponse(result)
  }
)
