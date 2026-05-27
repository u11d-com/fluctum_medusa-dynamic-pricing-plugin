import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import DynamicPricingModuleService from "../modules/dynamic-pricing/service"
import { DYNAMIC_PRICING_MODULE } from "../modules/dynamic-pricing"
import { getLinkKnex, LINK_TABLE } from "./steps/link-table"
import { generateEntityId } from "@medusajs/framework/utils"

// ── Image URLs (from Battalion Metals product photography) ────────────────────

const IMAGES = {
  goldEagle: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747770666038-au1use_randomyears_web.png",
  ],
  goldBuffalo: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747770744467-AU1USBUF-1-rev.png",
  ],
  goldMaple: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747770900782-AU1CML-1-rev.png",
  ],
  goldKrugerrand: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747767325825-au1kr_obverse_web_1.png",
  ],
  goldBritannia: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747767682052-rm_gold_brit_1varies_1oz_rev_0.5x.png",
  ],
  silverEagle: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1753278066306-AG1USE-T2-rev.png",
  ],
  silverMaple: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747773648175-AG1CML-reverse_randomyears_web.png",
  ],
  silverKrugerrand: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747773560395-AG1KR-1-rev.png",
  ],
}

// ── Seed data ──────────────────────────────────────────────────────────────────

type SeedVariant = {
  title: string
  weight_oz: number
}

type SeedProduct = {
  title: string
  subtitle: string
  material: "XAU" | "XAG"
  category: "Gold Coins" | "Gold Bars" | "Silver Coins" | "Silver Bars"
  images: string[]
  variants: SeedVariant[]
}

const SEED_PRODUCTS: SeedProduct[] = [
  // ── Gold Coins ──
  {
    title: "American Gold Eagle",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldEagle,
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
    category: "Gold Coins",
    images: IMAGES.goldBuffalo,
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Canadian Gold Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
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
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    variants: [
      { title: "1/10 oz", weight_oz: 0.1 },
      { title: "1/4 oz", weight_oz: 0.25 },
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
    ],
  },
  {
    title: "Gold Britannia",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    variants: [
      { title: "1/10 oz", weight_oz: 0.1 },
      { title: "1/4 oz", weight_oz: 0.25 },
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
    ],
  },
  // ── Gold Bars ──
  {
    title: "PAMP Suisse Gold Bar",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBritannia,
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
    category: "Gold Bars",
    images: IMAGES.goldBritannia,
    variants: [
      { title: "1 oz", weight_oz: 1 },
      { title: "10 oz", weight_oz: 10 },
    ],
  },
  // ── Silver Coins ──
  {
    title: "American Silver Eagle",
    subtitle: "US Mint bullion coin, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Canadian Silver Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverMaple,
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Austrian Silver Philharmonic",
    subtitle: "Austrian Mint, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Silver Britannia",
    subtitle: "The Royal Mint UK, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [{ title: "1 oz", weight_oz: 1 }],
  },
  {
    title: "Mexican Silver Libertad",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [
      { title: "1/2 oz", weight_oz: 0.5 },
      { title: "1 oz", weight_oz: 1 },
      { title: "2 oz", weight_oz: 2 },
      { title: "5 oz", weight_oz: 5 },
    ],
  },
  // ── Silver Bars ──
  {
    title: "PAMP Suisse Silver Bar",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverEagle,
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
    category: "Silver Bars",
    images: IMAGES.silverEagle,
    variants: [
      { title: "1 oz", weight_oz: 1 },
      { title: "10 oz", weight_oz: 10 },
      { title: "100 oz", weight_oz: 100 },
    ],
  },
]

// ── Step: Clean up previous seed data ──────────────────────────────────────────

const cleanupSeedStep = createStep(
  "cleanup-seed-step",
  async (_input: Record<string, never>, { container }) => {
    const productModule = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const dynamicPricingModule = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const knex = getLinkKnex(container)

    const existingProducts = await productModule.listProducts({}, { relations: ["variants", "categories"] })
    const existingCategories = await productModule.listProductCategories({})
    const existingPricingRules = await dynamicPricingModule.listPricingRules({})

    const linkEntryIds: { id: string }[] = await knex(LINK_TABLE).select("id")

    if (linkEntryIds.length > 0) {
      await knex(LINK_TABLE).delete()
    }

    if (existingPricingRules.length > 0) {
      await dynamicPricingModule.softDeletePricingRules(existingPricingRules.map((r) => r.id))
    }

    if (existingProducts.length > 0) {
      await productModule.softDeleteProducts(existingProducts.map((p) => p.id))
    }

    if (existingCategories.length > 0) {
      await productModule.softDeleteProductCategories(existingCategories.map((c) => c.id))
    }

    return new StepResponse({
      cleaned: {
        products: existingProducts.length,
        categories: existingCategories.length,
        pricingRules: existingPricingRules.length,
        links: linkEntryIds.length,
      },
    })
  }
)

// ── Step: Create categories + products + pricing rules ─────────────────────────

const seedProductsStep = createStep(
  "seed-products-step",
  async (_input: Record<string, never>, { container }) => {
    const productModule = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const dynamicPricingModule = container.resolve<DynamicPricingModuleService>(DYNAMIC_PRICING_MODULE)
    const knex = getLinkKnex(container)

    // ── Create categories ────────────────────────────────────────────────────
    const categoryNames = ["Gold Coins", "Gold Bars", "Silver Coins", "Silver Bars"]
    const createdCategories = await productModule.createProductCategories(
      categoryNames.map((name) => ({ name, is_active: true }))
    )
    const categoryByName: Record<string, string> = {}
    for (const cat of createdCategories) {
      categoryByName[cat.name] = cat.id
    }

    // ── Create pricing rules ─────────────────────────────────────────────────
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
    const ruleByMaterial: Record<string, typeof goldRule> = {
      XAU: goldRule,
      XAG: silverRule,
    }

    // ── Create products with variants ────────────────────────────────────────
    const createdProductNames: string[] = []

    for (const seed of SEED_PRODUCTS) {
      const rule = ruleByMaterial[seed.material]
      const weightLabels = seed.variants.map((v) => v.title)

      const [product] = await productModule.createProducts([{
        title: seed.title,
        subtitle: seed.subtitle,
        status: "published",
        category_ids: [categoryByName[seed.category]],
        images: seed.images.map((url) => ({ url })),
        options: [{ title: "Weight", values: weightLabels }],
        variants: seed.variants.map((v) => ({
          title: v.title,
          manage_inventory: false,
          options: { Weight: v.title },
          prices: [],
        })),
      }])

      // Fetch back with variants to get variant IDs
      const [productWithVariants] = await productModule.listProducts(
        { id: [product.id] },
        { relations: ["variants"] }
      )

      // Link each variant to the pricing rule with material + weight
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
        await knex.transaction((trx) => trx.insert(linkRows).into(LINK_TABLE))
      }

      createdProductNames.push(seed.title)
    }

    return new StepResponse({
      success: true,
      created_products: createdProductNames,
      pricing_rules: [goldRule.name, silverRule.name],
      categories: categoryNames,
    })
  }
)

// ── Workflow ───────────────────────────────────────────────────────────────────

export const seedProductsWorkflow = createWorkflow(
  "seed-products",
  function () {
    cleanupSeedStep({} as Record<string, never>)
    const result = seedProductsStep({} as Record<string, never>)
    return new WorkflowResponse(result)
  }
)
