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
// Each product represents a single weight. Variants are year editions only.

type SeedVariant = {
  year: string
}

type SeedProduct = {
  title: string
  subtitle: string
  material: "XAU" | "XAG" | "XPT" | "XPD"
  category: "Gold Coins" | "Gold Bars" | "Silver Coins" | "Silver Bars" | "Platinum Coins" | "Platinum Bars" | "Palladium Coins" | "Palladium Bars"
  images: string[]
  weight_oz: number
  variants: SeedVariant[]
  // Product information fields
  product_material?: string   // human-readable material description
  origin_country?: string     // ISO 2-letter country code
  product_type?: "Coin" | "Bar"
  dim_length?: number         // mm (diameter for coins, length for bars)
  dim_width?: number          // mm (diameter for coins, width for bars)
  dim_height?: number         // mm (thickness for coins, height for bars)
  translations?: Record<string, { title?: string; subtitle?: string }>
}

const SEED_PRODUCTS: SeedProduct[] = [
  // ── Gold Coins ──
  {
    title: "American Gold Eagle 1/10 oz",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldEagle,
    weight_oz: 0.1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "us", product_type: "Coin",
    dim_length: 17, dim_width: 17, dim_height: 1.3,
  },
  {
    title: "American Gold Eagle 1/4 oz",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldEagle,
    weight_oz: 0.25,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "us", product_type: "Coin",
    dim_length: 22, dim_width: 22, dim_height: 1.8,
  },
  {
    title: "American Gold Eagle 1/2 oz",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldEagle,
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "us", product_type: "Coin",
    dim_length: 27, dim_width: 27, dim_height: 2.2,
  },
  {
    title: "American Gold Eagle 1 oz",
    subtitle: "US Mint bullion coin, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldEagle,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }, { year: "Random Year" }],
    product_material: "Gold alloy (91.67%)", origin_country: "us", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.9,
  },
  {
    title: "American Gold Buffalo 1 oz",
    subtitle: "US Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBuffalo,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "us", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 3.0,
  },
  {
    title: "Canadian Gold Maple Leaf 1/10 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
    weight_oz: 0.1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Coin",
    dim_length: 16, dim_width: 16, dim_height: 1.2,
  },
  {
    title: "Canadian Gold Maple Leaf 1/4 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
    weight_oz: 0.25,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Coin",
    dim_length: 20, dim_width: 20, dim_height: 1.6,
  },
  {
    title: "Canadian Gold Maple Leaf 1/2 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Coin",
    dim_length: 25, dim_width: 25, dim_height: 2.2,
  },
  {
    title: "Canadian Gold Maple Leaf 1 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldMaple,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }, { year: "Random Year" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Coin",
    dim_length: 30, dim_width: 30, dim_height: 2.9,
  },
  {
    title: "South African Gold Krugerrand 1/10 oz",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    weight_oz: 0.1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "za", product_type: "Coin",
    dim_length: 17, dim_width: 17, dim_height: 1.2,
  },
  {
    title: "South African Gold Krugerrand 1/4 oz",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    weight_oz: 0.25,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "za", product_type: "Coin",
    dim_length: 22, dim_width: 22, dim_height: 1.6,
  },
  {
    title: "South African Gold Krugerrand 1/2 oz",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Gold alloy (91.67%)", origin_country: "za", product_type: "Coin",
    dim_length: 27, dim_width: 27, dim_height: 2.2,
  },
  {
    title: "South African Gold Krugerrand 1 oz",
    subtitle: "South African Mint, 91.67% gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldKrugerrand,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }, { year: "Random Year" }],
    product_material: "Gold alloy (91.67%)", origin_country: "za", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.8,
  },
  {
    title: "Gold Britannia 1/10 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    weight_oz: 0.1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "gb", product_type: "Coin",
    dim_length: 17, dim_width: 17, dim_height: 0.9,
  },
  {
    title: "Gold Britannia 1/4 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    weight_oz: 0.25,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "gb", product_type: "Coin",
    dim_length: 21, dim_width: 21, dim_height: 1.5,
  },
  {
    title: "Gold Britannia 1/2 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "gb", product_type: "Coin",
    dim_length: 25, dim_width: 25, dim_height: 2.0,
  },
  {
    title: "Gold Britannia 1 oz",
    subtitle: "The Royal Mint UK, 99.99% pure gold",
    material: "XAU",
    category: "Gold Coins",
    images: IMAGES.goldBritannia,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }, { year: "Random Year" }],
    product_material: "Fine gold (99.99%)", origin_country: "gb", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.8,
  },
  // ── Gold Bars ──
  {
    title: "PAMP Suisse Gold Bar 1 g",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    weight_oz: 0.03215,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ch", product_type: "Bar",
    dim_length: 15, dim_width: 9, dim_height: 1,
  },
  {
    title: "PAMP Suisse Gold Bar 5 g",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    weight_oz: 0.16075,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ch", product_type: "Bar",
    dim_length: 25, dim_width: 14, dim_height: 1,
  },
  {
    title: "PAMP Suisse Gold Bar 10 g",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    weight_oz: 0.3215,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ch", product_type: "Bar",
    dim_length: 31, dim_width: 18, dim_height: 1,
  },
  {
    title: "PAMP Suisse Gold Bar 1 oz",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    weight_oz: 1,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ch", product_type: "Bar",
    dim_length: 41, dim_width: 24, dim_height: 2,
  },
  {
    title: "PAMP Suisse Gold Bar 100 g",
    subtitle: "Swiss refinery, 99.99% pure gold, minted",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarValcambi,
    weight_oz: 3.215,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ch", product_type: "Bar",
    dim_length: 55, dim_width: 31, dim_height: 2,
  },
  {
    title: "Royal Canadian Mint Gold Bar 1 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarRand,
    weight_oz: 1,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Bar",
    dim_length: 40, dim_width: 24, dim_height: 3,
  },
  {
    title: "Royal Canadian Mint Gold Bar 10 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure gold",
    material: "XAU",
    category: "Gold Bars",
    images: IMAGES.goldBarRand,
    weight_oz: 10,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine gold (99.99%)", origin_country: "ca", product_type: "Bar",
    dim_length: 55, dim_width: 31, dim_height: 10,
  },
  // ── Silver Coins ──
  {
    title: "American Silver Eagle 1 oz",
    subtitle: "US Mint bullion coin, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "us", product_type: "Coin",
    dim_length: 41, dim_width: 41, dim_height: 3.0,
  },
  {
    title: "Canadian Silver Maple Leaf 1 oz",
    subtitle: "Royal Canadian Mint, 99.99% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverMaple,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.99%)", origin_country: "ca", product_type: "Coin",
    dim_length: 38, dim_width: 38, dim_height: 3.2,
  },
  {
    title: "Austrian Silver Philharmonic 1 oz",
    subtitle: "Austrian Mint, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "at", product_type: "Coin",
    dim_length: 37, dim_width: 37, dim_height: 3.1,
  },
  {
    title: "Silver Britannia 1 oz",
    subtitle: "The Royal Mint UK, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverEagle,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "gb", product_type: "Coin",
    dim_length: 39, dim_width: 39, dim_height: 3.1,
  },
  {
    title: "Mexican Silver Libertad 1/2 oz",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "mx", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.5,
  },
  {
    title: "Mexican Silver Libertad 1 oz",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "mx", product_type: "Coin",
    dim_length: 40, dim_width: 40, dim_height: 3.0,
  },
  {
    title: "Mexican Silver Libertad 2 oz",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    weight_oz: 2,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "mx", product_type: "Coin",
    dim_length: 48, dim_width: 48, dim_height: 3.5,
  },
  {
    title: "Mexican Silver Libertad 5 oz",
    subtitle: "Casa de Moneda de México, 99.9% pure silver",
    material: "XAG",
    category: "Silver Coins",
    images: IMAGES.silverKrugerrand,
    weight_oz: 5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }, { year: "Random Year" }],
    product_material: "Fine silver (99.9%)", origin_country: "mx", product_type: "Coin",
    dim_length: 65, dim_width: 65, dim_height: 6.0,
  },
  // ── Silver Bars ──
  {
    title: "PAMP Suisse Silver Bar 1 oz",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarPamp,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 41, dim_width: 24, dim_height: 4,
  },
  {
    title: "PAMP Suisse Silver Bar 5 oz",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarPamp,
    weight_oz: 5,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 59, dim_width: 35, dim_height: 7,
  },
  {
    title: "PAMP Suisse Silver Bar 10 oz",
    subtitle: "Swiss refinery, 99.9% pure silver, minted",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarPamp,
    weight_oz: 10,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 74, dim_width: 42, dim_height: 9,
  },
  {
    title: "Valcambi Silver Bar 1 oz",
    subtitle: "Valcambi Suisse, 99.9% pure silver",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarValcambi,
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 41, dim_width: 23, dim_height: 4,
  },
  {
    title: "Valcambi Silver Bar 10 oz",
    subtitle: "Valcambi Suisse, 99.9% pure silver",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarValcambi,
    weight_oz: 10,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 59, dim_width: 35, dim_height: 14,
  },
  {
    title: "Valcambi Silver Bar 100 oz",
    subtitle: "Valcambi Suisse, 99.9% pure silver",
    material: "XAG",
    category: "Silver Bars",
    images: IMAGES.silverBarValcambi,
    weight_oz: 100,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine silver (99.9%)", origin_country: "ch", product_type: "Bar",
    dim_length: 127, dim_width: 60, dim_height: 35,
  },
  // ── Platinum Coins ──
  {
    title: "American Platinum Eagle 1/10 oz",
    subtitle: "US Mint bullion coin, 99.95% pure platinum",
    material: "XPT",
    category: "Platinum Coins",
    images: [],
    weight_oz: 0.1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "us", product_type: "Coin",
    dim_length: 17, dim_width: 17, dim_height: 1.1,
  },
  {
    title: "American Platinum Eagle 1/4 oz",
    subtitle: "US Mint bullion coin, 99.95% pure platinum",
    material: "XPT",
    category: "Platinum Coins",
    images: [],
    weight_oz: 0.25,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "us", product_type: "Coin",
    dim_length: 22, dim_width: 22, dim_height: 1.8,
  },
  {
    title: "American Platinum Eagle 1/2 oz",
    subtitle: "US Mint bullion coin, 99.95% pure platinum",
    material: "XPT",
    category: "Platinum Coins",
    images: [],
    weight_oz: 0.5,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "us", product_type: "Coin",
    dim_length: 27, dim_width: 27, dim_height: 2.2,
  },
  {
    title: "American Platinum Eagle 1 oz",
    subtitle: "US Mint bullion coin, 99.95% pure platinum",
    material: "XPT",
    category: "Platinum Coins",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "us", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.4,
  },
  {
    title: "Canadian Platinum Maple Leaf 1 oz",
    subtitle: "Royal Canadian Mint, 99.95% pure platinum",
    material: "XPT",
    category: "Platinum Coins",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "ca", product_type: "Coin",
    dim_length: 30, dim_width: 30, dim_height: 2.9,
  },
  // ── Platinum Bars ──
  {
    title: "PAMP Suisse Platinum Bar 1 oz",
    subtitle: "Swiss refinery, 99.95% pure platinum, minted",
    material: "XPT",
    category: "Platinum Bars",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "ch", product_type: "Bar",
    dim_length: 41, dim_width: 24, dim_height: 2,
  },
  {
    title: "PAMP Suisse Platinum Bar 10 oz",
    subtitle: "Swiss refinery, 99.95% pure platinum, minted",
    material: "XPT",
    category: "Platinum Bars",
    images: [],
    weight_oz: 10,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine platinum (99.95%)", origin_country: "ch", product_type: "Bar",
    dim_length: 55, dim_width: 31, dim_height: 10,
  },
  // ── Palladium Coins ──
  {
    title: "Canadian Palladium Maple Leaf 1 oz",
    subtitle: "Royal Canadian Mint, 99.95% pure palladium",
    material: "XPD",
    category: "Palladium Coins",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine palladium (99.95%)", origin_country: "ca", product_type: "Coin",
    dim_length: 30, dim_width: 30, dim_height: 3.2,
  },
  {
    title: "Russian Palladium Ballerina 1 oz",
    subtitle: "Moscow Mint, 99.9% pure palladium",
    material: "XPD",
    category: "Palladium Coins",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2024" }, { year: "2025" }, { year: "2026" }],
    product_material: "Fine palladium (99.9%)", origin_country: "ru", product_type: "Coin",
    dim_length: 33, dim_width: 33, dim_height: 2.5,
  },
  // ── Palladium Bars ──
  {
    title: "PAMP Suisse Palladium Bar 1 oz",
    subtitle: "Swiss refinery, 99.95% pure palladium, minted",
    material: "XPD",
    category: "Palladium Bars",
    images: [],
    weight_oz: 1,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine palladium (99.95%)", origin_country: "ch", product_type: "Bar",
    dim_length: 41, dim_width: 24, dim_height: 2,
  },
  {
    title: "PAMP Suisse Palladium Bar 10 oz",
    subtitle: "Swiss refinery, 99.95% pure palladium, minted",
    material: "XPD",
    category: "Palladium Bars",
    images: [],
    weight_oz: 10,
    variants: [{ year: "2025" }, { year: "2026" }],
    product_material: "Fine palladium (99.95%)", origin_country: "ch", product_type: "Bar",
    dim_length: 55, dim_width: 31, dim_height: 10,
  },
]

// ── Translation data ──────────────────────────────────────────────────────────

const CATEGORY_TRANSLATIONS: Record<string, Record<string, { title: string }>> = {
  "Gold Coins":      { pl: { title: "Monety Złote" },      es: { title: "Monedas de Oro" },      de: { title: "Goldmünzen" } },
  "Gold Bars":       { pl: { title: "Sztabki Złota" },     es: { title: "Lingotes de Oro" },     de: { title: "Goldbarren" } },
  "Silver Coins":    { pl: { title: "Monety Srebrne" },    es: { title: "Monedas de Plata" },    de: { title: "Silbermünzen" } },
  "Silver Bars":     { pl: { title: "Sztabki Srebra" },    es: { title: "Lingotes de Plata" },   de: { title: "Silberbarren" } },
  "Platinum Coins":  { pl: { title: "Monety Platynowe" },  es: { title: "Monedas de Platino" },  de: { title: "Platinmünzen" } },
  "Platinum Bars":   { pl: { title: "Sztabki Platyny" },   es: { title: "Lingotes de Platino" }, de: { title: "Platinbarren" } },
  "Palladium Coins": { pl: { title: "Monety Palladowe" },  es: { title: "Monedas de Paladio" },  de: { title: "Palladiummünzen" } },
  "Palladium Bars":  { pl: { title: "Sztabki Palladu" },   es: { title: "Lingotes de Paladio" }, de: { title: "Palladiumbarren" } },
}

type ProductTranslationLocale = { title: string; subtitle: string }

const PRODUCT_TRANSLATIONS: Record<string, Record<string, ProductTranslationLocale>> = {
  // ── Gold Coins ──
  "American Gold Eagle 1/10 oz": {
    pl: { title: "Amerykański Złoty Orzeł 1/10 oz", subtitle: "Moneta bulionowa US Mint, stop złota 91,67%" },
    es: { title: "Águila de Oro Americana 1/10 oz", subtitle: "Moneda de bullion US Mint, aleación de oro 91,67%" },
    de: { title: "Amerikanischer Gold Eagle 1/10 oz", subtitle: "US Mint Bullionmünze, 91,67% Goldlegierung" },
  },
  "American Gold Eagle 1/4 oz": {
    pl: { title: "Amerykański Złoty Orzeł 1/4 oz", subtitle: "Moneta bulionowa US Mint, stop złota 91,67%" },
    es: { title: "Águila de Oro Americana 1/4 oz", subtitle: "Moneda de bullion US Mint, aleación de oro 91,67%" },
    de: { title: "Amerikanischer Gold Eagle 1/4 oz", subtitle: "US Mint Bullionmünze, 91,67% Goldlegierung" },
  },
  "American Gold Eagle 1/2 oz": {
    pl: { title: "Amerykański Złoty Orzeł 1/2 oz", subtitle: "Moneta bulionowa US Mint, stop złota 91,67%" },
    es: { title: "Águila de Oro Americana 1/2 oz", subtitle: "Moneda de bullion US Mint, aleación de oro 91,67%" },
    de: { title: "Amerikanischer Gold Eagle 1/2 oz", subtitle: "US Mint Bullionmünze, 91,67% Goldlegierung" },
  },
  "American Gold Eagle 1 oz": {
    pl: { title: "Amerykański Złoty Orzeł 1 oz", subtitle: "Moneta bulionowa US Mint, stop złota 91,67%" },
    es: { title: "Águila de Oro Americana 1 oz", subtitle: "Moneda de bullion US Mint, aleación de oro 91,67%" },
    de: { title: "Amerikanischer Gold Eagle 1 oz", subtitle: "US Mint Bullionmünze, 91,67% Goldlegierung" },
  },
  "American Gold Buffalo 1 oz": {
    pl: { title: "Amerykański Złoty Bizon 1 oz", subtitle: "US Mint, 99,99% czystego złota" },
    es: { title: "Bisonte de Oro Americano 1 oz", subtitle: "US Mint, oro puro 99,99%" },
    de: { title: "Amerikanischer Gold Buffalo 1 oz", subtitle: "US Mint, 99,99% reines Gold" },
  },
  "Canadian Gold Maple Leaf 1/10 oz": {
    pl: { title: "Kanadyjski Złoty Liść Klonu 1/10 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Hoja de Arce de Oro Canadiense 1/10 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Kanadisches Gold Maple Leaf 1/10 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  "Canadian Gold Maple Leaf 1/4 oz": {
    pl: { title: "Kanadyjski Złoty Liść Klonu 1/4 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Hoja de Arce de Oro Canadiense 1/4 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Kanadisches Gold Maple Leaf 1/4 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  "Canadian Gold Maple Leaf 1/2 oz": {
    pl: { title: "Kanadyjski Złoty Liść Klonu 1/2 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Hoja de Arce de Oro Canadiense 1/2 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Kanadisches Gold Maple Leaf 1/2 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  "Canadian Gold Maple Leaf 1 oz": {
    pl: { title: "Kanadyjski Złoty Liść Klonu 1 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Hoja de Arce de Oro Canadiense 1 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Kanadisches Gold Maple Leaf 1 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  "South African Gold Krugerrand 1/10 oz": {
    pl: { title: "Południowoafrykański Złoty Krugerrand 1/10 oz", subtitle: "Mennica Południowej Afryki, stop złota 91,67%" },
    es: { title: "Krugerrand de Oro Sudafricano 1/10 oz", subtitle: "Casa de Moneda de Sudáfrica, aleación de oro 91,67%" },
    de: { title: "Südafrikanischer Gold Krugerrand 1/10 oz", subtitle: "Südafrikanische Münze, 91,67% Goldlegierung" },
  },
  "South African Gold Krugerrand 1/4 oz": {
    pl: { title: "Południowoafrykański Złoty Krugerrand 1/4 oz", subtitle: "Mennica Południowej Afryki, stop złota 91,67%" },
    es: { title: "Krugerrand de Oro Sudafricano 1/4 oz", subtitle: "Casa de Moneda de Sudáfrica, aleación de oro 91,67%" },
    de: { title: "Südafrikanischer Gold Krugerrand 1/4 oz", subtitle: "Südafrikanische Münze, 91,67% Goldlegierung" },
  },
  "South African Gold Krugerrand 1/2 oz": {
    pl: { title: "Południowoafrykański Złoty Krugerrand 1/2 oz", subtitle: "Mennica Południowej Afryki, stop złota 91,67%" },
    es: { title: "Krugerrand de Oro Sudafricano 1/2 oz", subtitle: "Casa de Moneda de Sudáfrica, aleación de oro 91,67%" },
    de: { title: "Südafrikanischer Gold Krugerrand 1/2 oz", subtitle: "Südafrikanische Münze, 91,67% Goldlegierung" },
  },
  "South African Gold Krugerrand 1 oz": {
    pl: { title: "Południowoafrykański Złoty Krugerrand 1 oz", subtitle: "Mennica Południowej Afryki, stop złota 91,67%" },
    es: { title: "Krugerrand de Oro Sudafricano 1 oz", subtitle: "Casa de Moneda de Sudáfrica, aleación de oro 91,67%" },
    de: { title: "Südafrikanischer Gold Krugerrand 1 oz", subtitle: "Südafrikanische Münze, 91,67% Goldlegierung" },
  },
  "Gold Britannia 1/10 oz": {
    pl: { title: "Złota Britannia 1/10 oz", subtitle: "The Royal Mint Wielka Brytania, 99,99% czystego złota" },
    es: { title: "Britannia de Oro 1/10 oz", subtitle: "The Royal Mint Reino Unido, oro puro 99,99%" },
    de: { title: "Gold Britannia 1/10 oz", subtitle: "The Royal Mint Großbritannien, 99,99% reines Gold" },
  },
  "Gold Britannia 1/4 oz": {
    pl: { title: "Złota Britannia 1/4 oz", subtitle: "The Royal Mint Wielka Brytania, 99,99% czystego złota" },
    es: { title: "Britannia de Oro 1/4 oz", subtitle: "The Royal Mint Reino Unido, oro puro 99,99%" },
    de: { title: "Gold Britannia 1/4 oz", subtitle: "The Royal Mint Großbritannien, 99,99% reines Gold" },
  },
  "Gold Britannia 1/2 oz": {
    pl: { title: "Złota Britannia 1/2 oz", subtitle: "The Royal Mint Wielka Brytania, 99,99% czystego złota" },
    es: { title: "Britannia de Oro 1/2 oz", subtitle: "The Royal Mint Reino Unido, oro puro 99,99%" },
    de: { title: "Gold Britannia 1/2 oz", subtitle: "The Royal Mint Großbritannien, 99,99% reines Gold" },
  },
  "Gold Britannia 1 oz": {
    pl: { title: "Złota Britannia 1 oz", subtitle: "The Royal Mint Wielka Brytania, 99,99% czystego złota" },
    es: { title: "Britannia de Oro 1 oz", subtitle: "The Royal Mint Reino Unido, oro puro 99,99%" },
    de: { title: "Gold Britannia 1 oz", subtitle: "The Royal Mint Großbritannien, 99,99% reines Gold" },
  },
  // ── Gold Bars ──
  "PAMP Suisse Gold Bar 1 g": {
    pl: { title: "Sztabka Złota PAMP Suisse 1 g", subtitle: "Szwajcarska rafineria, 99,99% czystego złota, bite" },
    es: { title: "Lingote de Oro PAMP Suisse 1 g", subtitle: "Refinería suiza, oro puro 99,99%, acuñado" },
    de: { title: "PAMP Suisse Goldbarren 1 g", subtitle: "Schweizer Raffinerie, 99,99% reines Gold, geprägt" },
  },
  "PAMP Suisse Gold Bar 5 g": {
    pl: { title: "Sztabka Złota PAMP Suisse 5 g", subtitle: "Szwajcarska rafineria, 99,99% czystego złota, bite" },
    es: { title: "Lingote de Oro PAMP Suisse 5 g", subtitle: "Refinería suiza, oro puro 99,99%, acuñado" },
    de: { title: "PAMP Suisse Goldbarren 5 g", subtitle: "Schweizer Raffinerie, 99,99% reines Gold, geprägt" },
  },
  "PAMP Suisse Gold Bar 10 g": {
    pl: { title: "Sztabka Złota PAMP Suisse 10 g", subtitle: "Szwajcarska rafineria, 99,99% czystego złota, bite" },
    es: { title: "Lingote de Oro PAMP Suisse 10 g", subtitle: "Refinería suiza, oro puro 99,99%, acuñado" },
    de: { title: "PAMP Suisse Goldbarren 10 g", subtitle: "Schweizer Raffinerie, 99,99% reines Gold, geprägt" },
  },
  "PAMP Suisse Gold Bar 1 oz": {
    pl: { title: "Sztabka Złota PAMP Suisse 1 oz", subtitle: "Szwajcarska rafineria, 99,99% czystego złota, bite" },
    es: { title: "Lingote de Oro PAMP Suisse 1 oz", subtitle: "Refinería suiza, oro puro 99,99%, acuñado" },
    de: { title: "PAMP Suisse Goldbarren 1 oz", subtitle: "Schweizer Raffinerie, 99,99% reines Gold, geprägt" },
  },
  "PAMP Suisse Gold Bar 100 g": {
    pl: { title: "Sztabka Złota PAMP Suisse 100 g", subtitle: "Szwajcarska rafineria, 99,99% czystego złota, bite" },
    es: { title: "Lingote de Oro PAMP Suisse 100 g", subtitle: "Refinería suiza, oro puro 99,99%, acuñado" },
    de: { title: "PAMP Suisse Goldbarren 100 g", subtitle: "Schweizer Raffinerie, 99,99% reines Gold, geprägt" },
  },
  "Royal Canadian Mint Gold Bar 1 oz": {
    pl: { title: "Sztabka Złota Royal Canadian Mint 1 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Lingote de Oro Royal Canadian Mint 1 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Royal Canadian Mint Goldbarren 1 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  "Royal Canadian Mint Gold Bar 10 oz": {
    pl: { title: "Sztabka Złota Royal Canadian Mint 10 oz", subtitle: "Royal Canadian Mint, 99,99% czystego złota" },
    es: { title: "Lingote de Oro Royal Canadian Mint 10 oz", subtitle: "Royal Canadian Mint, oro puro 99,99%" },
    de: { title: "Royal Canadian Mint Goldbarren 10 oz", subtitle: "Royal Canadian Mint, 99,99% reines Gold" },
  },
  // ── Silver Coins ──
  "American Silver Eagle 1 oz": {
    pl: { title: "Amerykański Srebrny Orzeł 1 oz", subtitle: "Moneta bulionowa US Mint, 99,9% czystego srebra" },
    es: { title: "Águila de Plata Americana 1 oz", subtitle: "Moneda de bullion US Mint, plata pura 99,9%" },
    de: { title: "Amerikanischer Silber Eagle 1 oz", subtitle: "US Mint Bullionmünze, 99,9% reines Silber" },
  },
  "Canadian Silver Maple Leaf 1 oz": {
    pl: { title: "Kanadyjski Srebrny Liść Klonu 1 oz", subtitle: "Royal Canadian Mint, 99,99% czystego srebra" },
    es: { title: "Hoja de Arce de Plata Canadiense 1 oz", subtitle: "Royal Canadian Mint, plata pura 99,99%" },
    de: { title: "Kanadisches Silber Maple Leaf 1 oz", subtitle: "Royal Canadian Mint, 99,99% reines Silber" },
  },
  "Austrian Silver Philharmonic 1 oz": {
    pl: { title: "Austriacki Srebrny Filharmonik 1 oz", subtitle: "Mennica Austriacka, 99,9% czystego srebra" },
    es: { title: "Filarmónica de Plata Austriaca 1 oz", subtitle: "Casa de Moneda de Austria, plata pura 99,9%" },
    de: { title: "Österreichische Silber Philharmoniker 1 oz", subtitle: "Österreichische Münze, 99,9% reines Silber" },
  },
  "Silver Britannia 1 oz": {
    pl: { title: "Srebrna Britannia 1 oz", subtitle: "The Royal Mint Wielka Brytania, 99,9% czystego srebra" },
    es: { title: "Britannia de Plata 1 oz", subtitle: "The Royal Mint Reino Unido, plata pura 99,9%" },
    de: { title: "Silber Britannia 1 oz", subtitle: "The Royal Mint Großbritannien, 99,9% reines Silber" },
  },
  "Mexican Silver Libertad 1/2 oz": {
    pl: { title: "Meksykańska Srebrna Libertad 1/2 oz", subtitle: "Casa de Moneda de México, 99,9% czystego srebra" },
    es: { title: "Libertad de Plata Mexicana 1/2 oz", subtitle: "Casa de Moneda de México, plata pura 99,9%" },
    de: { title: "Mexikanische Silber Libertad 1/2 oz", subtitle: "Casa de Moneda de México, 99,9% reines Silber" },
  },
  "Mexican Silver Libertad 1 oz": {
    pl: { title: "Meksykańska Srebrna Libertad 1 oz", subtitle: "Casa de Moneda de México, 99,9% czystego srebra" },
    es: { title: "Libertad de Plata Mexicana 1 oz", subtitle: "Casa de Moneda de México, plata pura 99,9%" },
    de: { title: "Mexikanische Silber Libertad 1 oz", subtitle: "Casa de Moneda de México, 99,9% reines Silber" },
  },
  "Mexican Silver Libertad 2 oz": {
    pl: { title: "Meksykańska Srebrna Libertad 2 oz", subtitle: "Casa de Moneda de México, 99,9% czystego srebra" },
    es: { title: "Libertad de Plata Mexicana 2 oz", subtitle: "Casa de Moneda de México, plata pura 99,9%" },
    de: { title: "Mexikanische Silber Libertad 2 oz", subtitle: "Casa de Moneda de México, 99,9% reines Silber" },
  },
  "Mexican Silver Libertad 5 oz": {
    pl: { title: "Meksykańska Srebrna Libertad 5 oz", subtitle: "Casa de Moneda de México, 99,9% czystego srebra" },
    es: { title: "Libertad de Plata Mexicana 5 oz", subtitle: "Casa de Moneda de México, plata pura 99,9%" },
    de: { title: "Mexikanische Silber Libertad 5 oz", subtitle: "Casa de Moneda de México, 99,9% reines Silber" },
  },
  // ── Silver Bars ──
  "PAMP Suisse Silver Bar 1 oz": {
    pl: { title: "Sztabka Srebra PAMP Suisse 1 oz", subtitle: "Szwajcarska rafineria, 99,9% czystego srebra, bite" },
    es: { title: "Lingote de Plata PAMP Suisse 1 oz", subtitle: "Refinería suiza, plata pura 99,9%, acuñado" },
    de: { title: "PAMP Suisse Silberbarren 1 oz", subtitle: "Schweizer Raffinerie, 99,9% reines Silber, geprägt" },
  },
  "PAMP Suisse Silver Bar 5 oz": {
    pl: { title: "Sztabka Srebra PAMP Suisse 5 oz", subtitle: "Szwajcarska rafineria, 99,9% czystego srebra, bite" },
    es: { title: "Lingote de Plata PAMP Suisse 5 oz", subtitle: "Refinería suiza, plata pura 99,9%, acuñado" },
    de: { title: "PAMP Suisse Silberbarren 5 oz", subtitle: "Schweizer Raffinerie, 99,9% reines Silber, geprägt" },
  },
  "PAMP Suisse Silver Bar 10 oz": {
    pl: { title: "Sztabka Srebra PAMP Suisse 10 oz", subtitle: "Szwajcarska rafineria, 99,9% czystego srebra, bite" },
    es: { title: "Lingote de Plata PAMP Suisse 10 oz", subtitle: "Refinería suiza, plata pura 99,9%, acuñado" },
    de: { title: "PAMP Suisse Silberbarren 10 oz", subtitle: "Schweizer Raffinerie, 99,9% reines Silber, geprägt" },
  },
  "Valcambi Silver Bar 1 oz": {
    pl: { title: "Sztabka Srebra Valcambi 1 oz", subtitle: "Valcambi Suisse, 99,9% czystego srebra" },
    es: { title: "Lingote de Plata Valcambi 1 oz", subtitle: "Valcambi Suisse, plata pura 99,9%" },
    de: { title: "Valcambi Silberbarren 1 oz", subtitle: "Valcambi Suisse, 99,9% reines Silber" },
  },
  "Valcambi Silver Bar 10 oz": {
    pl: { title: "Sztabka Srebra Valcambi 10 oz", subtitle: "Valcambi Suisse, 99,9% czystego srebra" },
    es: { title: "Lingote de Plata Valcambi 10 oz", subtitle: "Valcambi Suisse, plata pura 99,9%" },
    de: { title: "Valcambi Silberbarren 10 oz", subtitle: "Valcambi Suisse, 99,9% reines Silber" },
  },
  "Valcambi Silver Bar 100 oz": {
    pl: { title: "Sztabka Srebra Valcambi 100 oz", subtitle: "Valcambi Suisse, 99,9% czystego srebra" },
    es: { title: "Lingote de Plata Valcambi 100 oz", subtitle: "Valcambi Suisse, plata pura 99,9%" },
    de: { title: "Valcambi Silberbarren 100 oz", subtitle: "Valcambi Suisse, 99,9% reines Silber" },
  },
  // ── Platinum Coins ──
  "American Platinum Eagle 1/10 oz": {
    pl: { title: "Amerykański Platynowy Orzeł 1/10 oz", subtitle: "Moneta bulionowa US Mint, 99,95% czystej platyny" },
    es: { title: "Águila de Platino Americana 1/10 oz", subtitle: "Moneda de bullion US Mint, platino puro 99,95%" },
    de: { title: "Amerikanischer Platin Eagle 1/10 oz", subtitle: "US Mint Bullionmünze, 99,95% reines Platin" },
  },
  "American Platinum Eagle 1/4 oz": {
    pl: { title: "Amerykański Platynowy Orzeł 1/4 oz", subtitle: "Moneta bulionowa US Mint, 99,95% czystej platyny" },
    es: { title: "Águila de Platino Americana 1/4 oz", subtitle: "Moneda de bullion US Mint, platino puro 99,95%" },
    de: { title: "Amerikanischer Platin Eagle 1/4 oz", subtitle: "US Mint Bullionmünze, 99,95% reines Platin" },
  },
  "American Platinum Eagle 1/2 oz": {
    pl: { title: "Amerykański Platynowy Orzeł 1/2 oz", subtitle: "Moneta bulionowa US Mint, 99,95% czystej platyny" },
    es: { title: "Águila de Platino Americana 1/2 oz", subtitle: "Moneda de bullion US Mint, platino puro 99,95%" },
    de: { title: "Amerikanischer Platin Eagle 1/2 oz", subtitle: "US Mint Bullionmünze, 99,95% reines Platin" },
  },
  "American Platinum Eagle 1 oz": {
    pl: { title: "Amerykański Platynowy Orzeł 1 oz", subtitle: "Moneta bulionowa US Mint, 99,95% czystej platyny" },
    es: { title: "Águila de Platino Americana 1 oz", subtitle: "Moneda de bullion US Mint, platino puro 99,95%" },
    de: { title: "Amerikanischer Platin Eagle 1 oz", subtitle: "US Mint Bullionmünze, 99,95% reines Platin" },
  },
  "Canadian Platinum Maple Leaf 1 oz": {
    pl: { title: "Kanadyjski Platynowy Liść Klonu 1 oz", subtitle: "Royal Canadian Mint, 99,95% czystej platyny" },
    es: { title: "Hoja de Arce de Platino Canadiense 1 oz", subtitle: "Royal Canadian Mint, platino puro 99,95%" },
    de: { title: "Kanadisches Platin Maple Leaf 1 oz", subtitle: "Royal Canadian Mint, 99,95% reines Platin" },
  },
  // ── Platinum Bars ──
  "PAMP Suisse Platinum Bar 1 oz": {
    pl: { title: "Sztabka Platyny PAMP Suisse 1 oz", subtitle: "Szwajcarska rafineria, 99,95% czystej platyny, bite" },
    es: { title: "Lingote de Platino PAMP Suisse 1 oz", subtitle: "Refinería suiza, platino puro 99,95%, acuñado" },
    de: { title: "PAMP Suisse Platinbarren 1 oz", subtitle: "Schweizer Raffinerie, 99,95% reines Platin, geprägt" },
  },
  "PAMP Suisse Platinum Bar 10 oz": {
    pl: { title: "Sztabka Platyny PAMP Suisse 10 oz", subtitle: "Szwajcarska rafineria, 99,95% czystej platyny, bite" },
    es: { title: "Lingote de Platino PAMP Suisse 10 oz", subtitle: "Refinería suiza, platino puro 99,95%, acuñado" },
    de: { title: "PAMP Suisse Platinbarren 10 oz", subtitle: "Schweizer Raffinerie, 99,95% reines Platin, geprägt" },
  },
  // ── Palladium Coins ──
  "Canadian Palladium Maple Leaf 1 oz": {
    pl: { title: "Kanadyjski Palladowy Liść Klonu 1 oz", subtitle: "Royal Canadian Mint, 99,95% czystego palladu" },
    es: { title: "Hoja de Arce de Paladio Canadiense 1 oz", subtitle: "Royal Canadian Mint, paladio puro 99,95%" },
    de: { title: "Kanadisches Palladium Maple Leaf 1 oz", subtitle: "Royal Canadian Mint, 99,95% reines Palladium" },
  },
  "Russian Palladium Ballerina 1 oz": {
    pl: { title: "Rosyjska Palladowa Baletnica 1 oz", subtitle: "Mennica Moskiewska, 99,9% czystego palladu" },
    es: { title: "Bailarina de Paladio Rusa 1 oz", subtitle: "Casa de Moneda de Moscú, paladio puro 99,9%" },
    de: { title: "Russische Palladium Ballerina 1 oz", subtitle: "Moskauer Münze, 99,9% reines Palladium" },
  },
  // ── Palladium Bars ──
  "PAMP Suisse Palladium Bar 1 oz": {
    pl: { title: "Sztabka Palladu PAMP Suisse 1 oz", subtitle: "Szwajcarska rafineria, 99,95% czystego palladu, bite" },
    es: { title: "Lingote de Paladio PAMP Suisse 1 oz", subtitle: "Refinería suiza, paladio puro 99,95%, acuñado" },
    de: { title: "PAMP Suisse Palladiumbarren 1 oz", subtitle: "Schweizer Raffinerie, 99,95% reines Palladium, geprägt" },
  },
  "PAMP Suisse Palladium Bar 10 oz": {
    pl: { title: "Sztabka Palladu PAMP Suisse 10 oz", subtitle: "Szwajcarska rafineria, 99,95% czystego palladu, bite" },
    es: { title: "Lingote de Paladio PAMP Suisse 10 oz", subtitle: "Refinería suiza, paladio puro 99,95%, acuñado" },
    de: { title: "PAMP Suisse Palladiumbarren 10 oz", subtitle: "Schweizer Raffinerie, 99,95% reines Palladium, geprägt" },
  },
}

const PLACEHOLDER_PRICE_CURRENCY_CODES = [
  "usd", "cad", "mxn", "brl", "ars", "eur", "gbp", "dkk", "sek", "pln",
  "czk", "huf", "ron", "ngn", "zar", "jpy", "krw", "aed", "sar", "qar",
  "kwd",
] as const

const PLACEHOLDER_PRICES = PLACEHOLDER_PRICE_CURRENCY_CODES.map((currency_code) => ({
  amount: 1,
  currency_code,
}))

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
    const categoryNames = [
      "Gold Coins", "Gold Bars",
      "Silver Coins", "Silver Bars",
      "Platinum Coins", "Platinum Bars",
      "Palladium Coins", "Palladium Bars",
    ]
    const createdCategories = await productModule.createProductCategories(
      categoryNames.map((name) => ({ name, is_active: true }))
    )
    const categoryByName: Record<string, string> = {}
    for (const cat of createdCategories) {
      categoryByName[cat.name] = cat.id
    }

    // ── Create product types ─────────────────────────────────────────────────
    const existingTypes = await productModule.listProductTypes({})
    const existingCoin = existingTypes.find((t) => t.value === "Coin")
    const existingBar = existingTypes.find((t) => t.value === "Bar")

    const coinTypeId = existingCoin
      ? existingCoin.id
      : (await productModule.createProductTypes([{ value: "Coin" }]))[0].id
    const barTypeId = existingBar
      ? existingBar.id
      : (await productModule.createProductTypes([{ value: "Bar" }]))[0].id

    // ── Create pricing rules ─────────────────────────────────────────────────
    // Smaller products have larger spreads (higher cost-to-value ratio).
    // Year-based premium is baked directly into each rule's spread_factor.
    type PricingRuleDef = { name: string; spread_factor: number; spread_fixed: number; premium_percentage: number; premium_fixed: number }

    const BASE_RULE_DEFS: PricingRuleDef[] = [
      { name: "Gold Small",          spread_factor: 1.03,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Medium",         spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Standard",       spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Gold Bar",            spread_factor: 1.01,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Small",        spread_factor: 1.04,  spread_fixed: 0, premium_percentage: 3, premium_fixed: 0 },
      { name: "Silver Standard",     spread_factor: 1.025, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Bulk",         spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Silver Bar",          spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Platinum Small",      spread_factor: 1.03,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Platinum Standard",   spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Platinum Bar",        spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Palladium Standard",  spread_factor: 1.02,  spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
      { name: "Palladium Bar",       spread_factor: 1.015, spread_fixed: 0, premium_percentage: 0, premium_fixed: 0 },
    ]

    const YEAR_SPREAD_MULT: Record<string, number> = {
      "2024": 1.002,
      "2025": 1.005,
      "2026": 1.01,
      "Random Year": 1,
    }

    function pickBaseRule(material: string, weightOz: number, category: string): string {
      if (material === "XAU") {
        if (category === "Gold Bars") return "Gold Bar"
        if (weightOz <= 0.25) return "Gold Small"
        if (weightOz <= 0.5) return "Gold Medium"
        return "Gold Standard"
      }
      if (material === "XAG") {
        if (category === "Silver Bars") {
          if (weightOz >= 100) return "Silver Bulk"
          return "Silver Bar"
        }
        if (weightOz <= 0.5) return "Silver Small"
        if (weightOz >= 5) return "Silver Bulk"
        return "Silver Standard"
      }
      if (material === "XPT") {
        if (category === "Platinum Bars") return "Platinum Bar"
        if (weightOz <= 0.25) return "Platinum Small"
        return "Platinum Standard"
      }
      // XPD
      if (category === "Palladium Bars") return "Palladium Bar"
      return "Palladium Standard"
    }

    // Generate year-versioned pricing rules
    const seenRuleKeys = new Set<string>()
    const pricingRuleDefs: PricingRuleDef[] = []

    for (const seed of SEED_PRODUCTS) {
      for (const v of seed.variants) {
        const baseName = pickBaseRule(seed.material, seed.weight_oz, seed.category)
        const yearKey = v.year === "Random Year" ? "Random Year" : v.year
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
      const yearKey = year === "Random Year" ? "Random Year" : year
      return `${baseName} ${yearKey}`
    }

    // ── Create products with variants ────────────────────────────────────────
    const createdProductNames: string[] = []
    const createdProductIds: string[] = []

    for (const seed of SEED_PRODUCTS) {
      const yearLabels = seed.variants.map((v) => v.year)

      const [product] = await productModule.createProducts([{
        title: seed.title,
        subtitle: seed.subtitle,
        status: "published",
        category_ids: [categoryByName[seed.category]],
        material: seed.product_material,
        origin_country: seed.origin_country,
        type_id: seed.product_type === "Coin" ? coinTypeId : seed.product_type === "Bar" ? barTypeId : undefined,
        weight: Math.round(seed.weight_oz * 31.103 * 100) / 100,
        length: seed.dim_length,
        width: seed.dim_width,
        height: seed.dim_height,
        ...(seed.images.length > 0 ? { images: seed.images.map((url) => ({ url })) } : {}),
        options: [{ title: "Year", values: yearLabels }],
        variants: seed.variants.map((v) => ({
          title: v.year,
          manage_inventory: false,
          weight: Math.round(seed.weight_oz * 31.103 * 100) / 100,
          options: { Year: v.year },
          prices: PLACEHOLDER_PRICES,
        })),
      }])
      createdProductIds.push(product.id)

      // Fetch back with variants to get variant IDs
      const [productWithVariants] = await productModule.listProducts(
        { id: [product.id] },
        { relations: ["variants"] }
      )

      // Link each variant to the pricing rule for this product's weight + year
      const now = new Date()
      const linkRows = (productWithVariants.variants ?? []).map((variant) => {
        const seedVariant = seed.variants.find((sv) => sv.year === variant.title)
        const ruleName = pickRule(seed.material, seed.weight_oz, seed.category, seedVariant?.year ?? "Random Year")
        const rule = ruleByName[ruleName]
        return {
          id: generateEntityId("", "link"),
          product_variant_id: variant.id,
          pricing_rule_id: rule!.id,
          material: seed.material,
          weight_oz: seed.weight_oz,
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
        prices: PLACEHOLDER_PRICES,
      }))
    )

    await remoteLink.create(
      allVariants.map((v, i) => ({
        [Modules.PRODUCT]: { variant_id: v.id },
        [Modules.PRICING]: { price_set_id: priceSets[i].id },
      }))
    )

    // ── Create translations ──────────────────────────────────────────────────
    try {
      const translationModule = container.resolve(Modules.TRANSLATION)
      const translationEntries: Array<{
        reference: string
        reference_id: string
        locale_code: string
        translations: Record<string, string>
      }> = []

      // Category translations (8 categories × 3 locales = 24 entries)
      for (const [catName, catId] of Object.entries(categoryByName)) {
        const catTrans = CATEGORY_TRANSLATIONS[catName]
        if (!catTrans) continue
        for (const [localeCode, data] of Object.entries(catTrans)) {
          translationEntries.push({ reference: "product_category", reference_id: catId, locale_code: localeCode, translations: data })
        }
      }

      // Product translations (49 products × 3 locales = 147 entries)
      for (let i = 0; i < SEED_PRODUCTS.length; i++) {
        const seed = SEED_PRODUCTS[i]
        const productId = createdProductIds[i]
        const productTrans = PRODUCT_TRANSLATIONS[seed.title]
        if (!productTrans || !productId) continue
        for (const [localeCode, data] of Object.entries(productTrans)) {
          translationEntries.push({ reference: "product", reference_id: productId, locale_code: localeCode, translations: data })
        }
      }

      if (translationEntries.length > 0) {
        await translationModule.createTranslations(translationEntries)
      }
    } catch (e) {
      console.warn("[seed] Translation module not available — skipping translations:", (e as Error).message)
    }

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
