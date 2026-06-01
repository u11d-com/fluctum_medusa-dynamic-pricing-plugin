import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IProductModuleService, ProductVariantDTO } from "@medusajs/types"
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
  goldBarRand: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1750119111120-AU1BARRAND_1.png",
  ],
  goldBarValcambi: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1749508250789-AU1.6705VALCAMBI_01.png",
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
  silverBarPamp: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1747771385591-AG10BARPAMP-single.png",
  ],
  silverBarValcambi: [
    "https://jwdkcxwjmzopyijqvodr.supabase.co/storage/v1/object/public/product-images/1748442100994-AG32.15BARVALCAMBI-noSerial.jpg",
  ],
}

// ── Seed data ──────────────────────────────────────────────────────────────────

type SeedVariant = {
  title: string
  weight_oz: number
  year: string
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
      { title: "1/10 oz", weight_oz: 0.1, year: "2024" },
      { title: "1/4 oz", weight_oz: 0.25, year: "2025" },
      { title: "1/2 oz", weight_oz: 0.5, year: "2026" },
      { title: "1 oz", weight_oz: 1, year: "Random" },
    ],
  },
  {
    title: "1 oz 2026 American Gold Buffalo",
    subtitle: "US Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBuffalo,
    variants: [{ title: "1 oz 2026", weight_oz: 1, year: "2026" }],
  },
  {
    title: "Canadian Gold Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
    variants: [
      { title: "1/10 oz", weight_oz: 0.1, year: "2024" },
      { title: "1/4 oz", weight_oz: 0.25, year: "2025" },
      { title: "1/2 oz", weight_oz: 0.5, year: "2026" },
      { title: "1 oz", weight_oz: 1, year: "Random" },
    ],
  },
  {
    title: "South African Gold Krugerrand",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    variants: [
      { title: "1/10 oz", weight_oz: 0.1, year: "2024" },
      { title: "1/4 oz", weight_oz: 0.25, year: "2025" },
      { title: "1/2 oz", weight_oz: 0.5, year: "2026" },
      { title: "1 oz", weight_oz: 1, year: "Random" },
    ],
  },
  {
    title: "Gold Britannia",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    variants: [
      { title: "1/10 oz", weight_oz: 0.1, year: "2024" },
      { title: "1/4 oz", weight_oz: 0.25, year: "2025" },
      { title: "1/2 oz", weight_oz: 0.5, year: "2026" },
      { title: "1 oz", weight_oz: 1, year: "Random" },
    ],
  },
  // ── Gold Bars ──
  {
    title: "PAMP Suisse Gold Bar",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    variants: [
      { title: "1 g", weight_oz: 0.03215, year: "2025" },
      { title: "5 g", weight_oz: 0.16075, year: "2026" },
      { title: "10 g", weight_oz: 0.3215, year: "Random" },
      { title: "1 oz", weight_oz: 1, year: "2026" },
      { title: "100 g", weight_oz: 3.215, year: "Random" },
    ],
  },
  {
    title: "Royal Canadian Mint Gold Bar",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarRand,
    variants: [
      { title: "1 oz", weight_oz: 1, year: "2025" },
      { title: "10 oz", weight_oz: 10, year: "2026" },
    ],
  },
  // ── Silver Coins ──
  {
    title: "1 oz 2026 American Silver Eagle",
    subtitle: "US Mint bullion coin, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [{ title: "1 oz 2026", weight_oz: 1, year: "2026" }],
  },
  {
    title: "1 oz 2026 Canadian Silver Maple Leaf",
    subtitle: "Royal Canadian Mint, 99.99% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverMaple,
    variants: [{ title: "1 oz 2026", weight_oz: 1, year: "2026" }],
  },
  {
    title: "1 oz 2026 Austrian Silver Philharmonic",
    subtitle: "Austrian Mint, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    variants: [{ title: "1 oz 2026", weight_oz: 1, year: "2026" }],
  },
  {
    title: "1 oz 2026 Silver Britannia",
    subtitle: "The Royal Mint UK, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    variants: [{ title: "1 oz 2026", weight_oz: 1, year: "2026" }],
  },
  {
    title: "Mexican Silver Libertad",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    variants: [
      { title: "1/2 oz", weight_oz: 0.5, year: "2024" },
      { title: "1 oz", weight_oz: 1, year: "2025" },
      { title: "2 oz", weight_oz: 2, year: "2026" },
      { title: "5 oz", weight_oz: 5, year: "Random" },
    ],
  },
  // ── Silver Bars ──
  {
    title: "PAMP Suisse Silver Bar",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarPamp,
    variants: [
      { title: "1 oz", weight_oz: 1, year: "2024" },
      { title: "5 oz", weight_oz: 5, year: "2025" },
      { title: "10 oz", weight_oz: 10, year: "2026" },
    ],
  },
  {
    title: "Valcambi Silver Bar",
    subtitle: "Valcambi Suisse, 99.9% pure silver",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarValcambi,
    variants: [
      { title: "1 oz", weight_oz: 1, year: "2024" },
      { title: "10 oz", weight_oz: 10, year: "2025" },
      { title: "100 oz", weight_oz: 100, year: "2026" },
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
    // Smaller products have larger spreads (higher cost-to-value ratio).
    // Year-based premium is baked directly into each rule's spread_factor
    // (separate rules created per year, no runtime year logic needed).
    type PricingRuleDef = { name: string; spread_factor: number; spread_fixed: number; premium_percentage: number; premium_fixed: number }

    const BASE_RULE_DEFS: PricingRuleDef[] = [
      { name: "Gold Small",    spread_factor: 1.03,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Medium",   spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Standard", spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Bar",      spread_factor: 1.01,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Small",  spread_factor: 1.04,  spread_fixed: 0, premium_percentage: 3, premium_fixed: 0 },
      { name: "Silver Standard", spread_factor: 1.025, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Bulk",   spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Bar",    spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
    ]

    const YEAR_SPREAD_MULT: Record<string, number> = {
      "2024": 1.002,
      "2025": 1.005,
      "2026": 1.01,
      "Random": 1,
    }

    function pickBaseRule(material: string, weightOz: number, category: string): string {
      if (material === "XAU") {
        if (category === "Gold Bars") return "Gold Bar"
        if (weightOz <= 0.25) return "Gold Small"
        if (weightOz <= 0.5) return "Gold Medium"
        return "Gold Standard"
      }
      if (category === "Silver Bars") {
        if (weightOz >= 100) return "Silver Bulk"
        return "Silver Bar"
      }
      if (weightOz <= 0.5) return "Silver Small"
      if (weightOz >= 5) return "Silver Bulk"
      return "Silver Standard"
    }

    // Generate year-versioned pricing rules
    const seenRuleKeys = new Set<string>()
    const pricingRuleDefs: PricingRuleDef[] = []

    for (const seed of SEED_PRODUCTS) {
      for (const v of seed.variants) {
        const baseName = pickBaseRule(seed.material, v.weight_oz, seed.category)
        const yearKey = v.year === "Random" ? "Random" : v.year
        const ruleKey = `${baseName} ${yearKey}`
        if (seenRuleKeys.has(ruleKey)) continue
        seenRuleKeys.add(ruleKey)

        const base = BASE_RULE_DEFS.find((r) => r.name === baseName)!
        const mult = YEAR_SPREAD_MULT[yearKey] ?? 1
        pricingRuleDefs.push({
          name: ruleKey,
          spread_factor: Math.round(base.spread_factor * mult * 1e6) / 1e6,
          spread_fixed: base.spread_fixed,
          premium_percentage: base.premium_percentage,
          premium_fixed: base.premium_fixed,
        })
      }
    }

    const createdRules = await dynamicPricingModule.createPricingRules(pricingRuleDefs)
    const ruleByName: Record<string, (typeof createdRules)[number]> = {}
    for (const r of createdRules) {
      ruleByName[r.name] = r
    }

    function pickRule(material: string, weightOz: number, category: string, year: string): string {
      const baseName = pickBaseRule(material, weightOz, category)
      const yearKey = year === "Random" ? "Random" : year
      return `${baseName} ${yearKey}`
    }

    // ── Create products with variants ────────────────────────────────────────
    const createdProductNames: string[] = []
    const createdProductIds: string[] = []

    for (const seed of SEED_PRODUCTS) {
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
          weight: Math.round(v.weight_oz * 31.103 * 100) / 100,
          options: { Weight: v.title },
          prices: [{ amount: 1, currency_code: "usd" }],
        })),
      }])
      createdProductIds.push(product.id)

      // Fetch back with variants to get variant IDs
      const [productWithVariants] = await productModule.listProducts(
        { id: [product.id] },
        { relations: ["variants"] }
      )

      // Link each variant to the appropriate pricing rule based on weight + year
      const now = new Date()
      const linkRows = (productWithVariants.variants ?? []).map((variant) => {
        const seedVariant = seed.variants.find((sv) => sv.title === variant.title)
        const ruleName = pickRule(seed.material, seedVariant?.weight_oz ?? 0, seed.category, seedVariant?.year ?? "Random")
        const rule = ruleByName[ruleName]
        return {
          id: generateEntityId("", "link"),
          product_variant_id: variant.id,
          pricing_rule_id: rule!.id,
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

    // ── Create price sets and link to variants ─────────────────────────────
    // productModule.createProducts ignores `prices` — we must create price
    // sets via the pricing module and link them manually.
    const pricingModule = container.resolve(Modules.PRICING)
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)

    const allVariants: ProductVariantDTO[] = []
    for (const pid of createdProductIds) {
      const [p] = await productModule.listProducts({ id: [pid] }, { relations: ["variants"] })
      if (p?.variants) allVariants.push(...p.variants)
    }

    const priceSets = await pricingModule.createPriceSets(
      allVariants.map(() => ({
        prices: [
          { amount: 1, currency_code: "usd" },
          { amount: 1, currency_code: "eur" },
        ],
      }))
    )

    await remoteLink.create(
      allVariants.map((v, i) => ({
        [Modules.PRODUCT]: { variant_id: v.id },
        [Modules.PRICING]: { price_set_id: priceSets[i].id },
      }))
    )

    return new StepResponse({
      success: true,
      created_products: createdProductNames,
      created_product_ids: createdProductIds,
      pricing_rules: pricingRuleDefs.map((r) => r.name),
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
