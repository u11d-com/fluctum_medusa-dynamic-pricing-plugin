import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { seedProductsWorkflow, DYNAMIC_PRICING_MODULE } from "@u11d/medusa-dynamic-pricing";

type QueryRecord = Record<string, unknown>

type DynamicPricingServiceLike = {
  getLatestRates(fromCurrency: string, toCurrencies?: string[]): Promise<Array<Record<string, unknown>>>
  bulkCreateRates(rows: Array<{ from_currency: string; to_currency: string; rate: number }>): Promise<void>
}

// ── Region configuration ───────────────────────────────────────────────────

type RegionConfig = {
  name: string
  currency_code: string       // lowercase ISO-4217
  countries: string[]         // lowercase ISO-2
  standardShipping: number    // amount in region currency
  expressShipping: number
}

const REGIONS: RegionConfig[] = [
  { name: "United States",  currency_code: "usd", countries: ["us"],                                                                                                                   standardShipping: 10,    expressShipping: 25    },
  { name: "Canada",         currency_code: "cad", countries: ["ca"],                                                                                                                   standardShipping: 15,    expressShipping: 35    },
  { name: "Mexico",         currency_code: "mxn", countries: ["mx"],                                                                                                                   standardShipping: 200,   expressShipping: 400   },
  { name: "Brazil",         currency_code: "brl", countries: ["br"],                                                                                                                   standardShipping: 50,    expressShipping: 100   },
  { name: "Argentina",      currency_code: "ars", countries: ["ar"],                                                                                                                   standardShipping: 2000,  expressShipping: 4000  },
  { name: "Europe",         currency_code: "eur", countries: ["de","fr","es","it","nl","be","at","ie","fi","pt","gr","lu","cy","mt","ee","lv","lt","si","sk","hr"],                    standardShipping: 10,    expressShipping: 20    },
  { name: "United Kingdom", currency_code: "gbp", countries: ["gb"],                                                                                                                   standardShipping: 8,     expressShipping: 15    },
  { name: "Denmark",        currency_code: "dkk", countries: ["dk"],                                                                                                                   standardShipping: 70,    expressShipping: 140   },
  { name: "Sweden",         currency_code: "sek", countries: ["se"],                                                                                                                   standardShipping: 100,   expressShipping: 200   },
  { name: "Poland",         currency_code: "pln", countries: ["pl"],                                                                                                                   standardShipping: 40,    expressShipping: 80    },
  { name: "Czechia",        currency_code: "czk", countries: ["cz"],                                                                                                                   standardShipping: 250,   expressShipping: 500   },
  { name: "Hungary",        currency_code: "huf", countries: ["hu"],                                                                                                                   standardShipping: 3500,  expressShipping: 7000  },
  { name: "Romania",        currency_code: "ron", countries: ["ro"],                                                                                                                   standardShipping: 45,    expressShipping: 90    },
  { name: "Nigeria",        currency_code: "ngn", countries: ["ng"],                                                                                                                   standardShipping: 6000,  expressShipping: 12000 },
  { name: "South Africa",   currency_code: "zar", countries: ["za"],                                                                                                                   standardShipping: 150,   expressShipping: 300   },
  { name: "Japan",          currency_code: "jpy", countries: ["jp"],                                                                                                                   standardShipping: 1500,  expressShipping: 3000  },
  { name: "South Korea",    currency_code: "krw", countries: ["kr"],                                                                                                                   standardShipping: 12000, expressShipping: 25000 },
  { name: "UAE",            currency_code: "aed", countries: ["ae"],                                                                                                                   standardShipping: 35,    expressShipping: 70    },
  { name: "Saudi Arabia",   currency_code: "sar", countries: ["sa"],                                                                                                                   standardShipping: 40,    expressShipping: 80    },
  { name: "Qatar",          currency_code: "qar", countries: ["qa"],                                                                                                                   standardShipping: 35,    expressShipping: 70    },
  { name: "Kuwait",         currency_code: "kwd", countries: ["kw"],                                                                                                                   standardShipping: 3,     expressShipping: 6     },
]

const ALL_CURRENCIES = REGIONS.map((r) => r.currency_code)

const FX_RATES_FROM_USD: Array<{ from_currency: string; to_currency: string; rate: number }> = [
  { from_currency: "USD", to_currency: "CAD", rate: 1.36 },
  { from_currency: "USD", to_currency: "MXN", rate: 18.5 },
  { from_currency: "USD", to_currency: "BRL", rate: 5.1 },
  { from_currency: "USD", to_currency: "ARS", rate: 1000 },
  { from_currency: "USD", to_currency: "EUR", rate: 0.92 },
  { from_currency: "USD", to_currency: "GBP", rate: 0.79 },
  { from_currency: "USD", to_currency: "DKK", rate: 6.85 },
  { from_currency: "USD", to_currency: "SEK", rate: 10.4 },
  { from_currency: "USD", to_currency: "PLN", rate: 4.0 },
  { from_currency: "USD", to_currency: "CZK", rate: 23.0 },
  { from_currency: "USD", to_currency: "HUF", rate: 355 },
  { from_currency: "USD", to_currency: "RON", rate: 4.58 },
  { from_currency: "USD", to_currency: "NGN", rate: 1550 },
  { from_currency: "USD", to_currency: "ZAR", rate: 18.2 },
  { from_currency: "USD", to_currency: "JPY", rate: 155 },
  { from_currency: "USD", to_currency: "KRW", rate: 1370 },
  { from_currency: "USD", to_currency: "AED", rate: 3.67 },
  { from_currency: "USD", to_currency: "SAR", rate: 3.75 },
  { from_currency: "USD", to_currency: "QAR", rate: 3.64 },
  { from_currency: "USD", to_currency: "KWD", rate: 0.31 },
]

// ── Seed function ──────────────────────────────────────────────────────────

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  // ── Sales Channel ──────────────────────────────────────────────────────

  const { data: existingSalesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const defaultChannel = existingSalesChannels.find((s: QueryRecord) => s.name === "Default Sales Channel")

  let defaultSalesChannelId: string
  if (defaultChannel) {
    defaultSalesChannelId = defaultChannel.id as string
    logger.info("Using existing Default Sales Channel")
  } else {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Default Sales Channel", description: "Created by Medusa" },
        ],
      },
    })
    defaultSalesChannelId = result[0].id
    logger.info("Created Default Sales Channel")
  }

  // ── API Key + Link ─────────────────────────────────────────────────────

  const { data: existingApiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "title"],
  })
  const existingKey = existingApiKeys.find((k: QueryRecord) => k.title === "Default Publishable API Key")
  let publishableKeyId: string
  if (existingKey) {
    publishableKeyId = existingKey.id as string
    logger.info(`Using existing API key: ${(existingKey.token as string).substring(0, 20)}...`)
  } else {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        }],
      },
    })
    publishableKeyId = result[0].id
    logger.info("Created API key")
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKeyId, add: [defaultSalesChannelId] },
  })
  logger.info("API key linked to sales channel")

  // ── Store ──────────────────────────────────────────────────────────────

  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id", "name", "supported_currencies.currency_code"],
  })

  if (existingStores.length === 0) {
    await createStoresWorkflow(container).run({
      input: {
        stores: [{
          name: "Default Store",
          supported_currencies: ALL_CURRENCIES.map((code) => ({
            currency_code: code,
            is_default: code === "usd",
          })),
          default_sales_channel_id: defaultSalesChannelId,
        }],
      },
    })
    logger.info(`Created Default Store with ${ALL_CURRENCIES.length} currencies`)
  } else {
    const store = existingStores[0] as QueryRecord
    const existingCurrencies = (store.supported_currencies as Array<{ currency_code: string }> ?? [])
      .map((c) => c.currency_code)
    const existingSet = new Set(existingCurrencies)
    const missing = ALL_CURRENCIES.filter((c) => !existingSet.has(c))

    if (missing.length > 0) {
      const fullUnion = [...new Set([...existingCurrencies, ...ALL_CURRENCIES])]
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id as string },
          update: {
            supported_currencies: fullUnion.map((code) => ({
              currency_code: code,
              is_default: code === "usd",
            })),
          },
        },
      })
      logger.info(`Updated store currencies — added ${missing.length} missing currencies`)
    } else {
      logger.info(`Using existing store: ${store.name}`)
    }
  }

  // ── Regions ────────────────────────────────────────────────────────────

  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  const existingRegionNames = new Set(existingRegions.map((r: QueryRecord) => r.name as string))
  const regionsToCreate = REGIONS.filter((r) => !existingRegionNames.has(r.name))

  let allRegions: QueryRecord[] = [...existingRegions]

  if (regionsToCreate.length > 0) {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: regionsToCreate.map((r) => ({
          name: r.name,
          currency_code: r.currency_code,
          countries: r.countries,
          payment_providers: ["pp_system_default"],
        })),
      },
    })
    allRegions = [...allRegions, ...(regionResult as unknown as QueryRecord[])]
    logger.info(`Created ${regionsToCreate.length} new regions`)
  } else {
    logger.info("All regions already exist — skipping region creation")
  }

  // ── Tax Regions ────────────────────────────────────────────────────────

  const allCountries = [...new Set(REGIONS.flatMap((r) => r.countries))]
  try {
    await createTaxRegionsWorkflow(container).run({
      input: allCountries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    })
    logger.info("Seeded tax regions")
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("UniqueConstraint")) {
      logger.info("Tax regions already exist — skipping")
    } else {
      throw err
    }
  }

  // ── Stock Location ─────────────────────────────────────────────────────

  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  let stockLocation: QueryRecord = existingLocations.find((l: QueryRecord) => l.name === "Main Warehouse") as QueryRecord

  if (stockLocation) {
    logger.info("Using existing stock location")
  } else {
    const { result: slResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [{
          name: "Main Warehouse",
          address: { city: "New York", country_code: "US", address_1: "" },
        }],
      },
    })
    stockLocation = slResult[0] as unknown as QueryRecord
    logger.info("Created stock location")
  }

  // Fulfillment provider link (idempotent via ON CONFLICT DO NOTHING)
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  // ── Fulfillment Set + Service Zones ────────────────────────────────────

  const { data: existingSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
  })
  let fulfillmentSet: QueryRecord = existingSets.find((s: QueryRecord) => s.name === "Main Warehouse delivery") as QueryRecord

  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Main Warehouse delivery",
      type: "shipping",
      service_zones: REGIONS.map((r) => ({
        name: `${r.name} Zone`,
        geo_zones: r.countries.map((c) => ({ country_code: c, type: "country" as const })),
      })),
    }) as unknown as QueryRecord
    logger.info("Created fulfillment set with all region zones")
  } else {
    const existingZones = (fulfillmentSet as QueryRecord).service_zones as QueryRecord[] | undefined ?? []
    const existingZoneNames = new Set(existingZones.map((z: QueryRecord) => z.name as string))
    const zonesToCreate = REGIONS
      .filter((r) => !existingZoneNames.has(`${r.name} Zone`))
      .map((r) => ({
        name: `${r.name} Zone`,
        fulfillment_set_id: fulfillmentSet.id as string,
        geo_zones: r.countries.map((c) => ({ country_code: c, type: "country" as const })),
      }))

    if (zonesToCreate.length > 0) {
      await fulfillmentModuleService.createServiceZones(zonesToCreate)
      logger.info(`Created ${zonesToCreate.length} new service zones`)
    } else {
      logger.info("All service zones already exist")
    }
  }

  // Link stock location → fulfillment set (idempotent)
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  // ── Shipping Options ───────────────────────────────────────────────────

  const { data: existingShippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = existingShippingProfiles[0] as QueryRecord

  // Re-query to get fresh service zone IDs after any zone creation
  const { data: freshSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
  })
  const freshSet = freshSets.find((s: QueryRecord) => s.name === "Main Warehouse delivery") as QueryRecord
  const freshZones: QueryRecord[] = ((freshSet as QueryRecord)?.service_zones as QueryRecord[] | undefined) ?? []

  const zoneByRegionName = new Map<string, QueryRecord>()
  for (const zone of freshZones) {
    const zoneName = zone.name as string
    // Zone name is "${regionName} Zone" — extract region name
    if (zoneName.endsWith(" Zone")) {
      const regionName = zoneName.slice(0, -" Zone".length)
      zoneByRegionName.set(regionName, zone)
    }
  }

  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id"],
  })

  // Build map: zone_id → Set of existing option names
  const optionsByZoneId = new Map<string, Set<string>>()
  for (const opt of existingOptions as QueryRecord[]) {
    const zoneId = opt.service_zone_id as string
    if (!optionsByZoneId.has(zoneId)) {
      optionsByZoneId.set(zoneId, new Set())
    }
    optionsByZoneId.get(zoneId)!.add(opt.name as string)
  }

  for (const regionConfig of REGIONS) {
    const zone = zoneByRegionName.get(regionConfig.name)
    if (!zone) continue

    const existingNames = optionsByZoneId.get(zone.id as string) ?? new Set<string>()
    const toCreate: Array<{ name: string; amount: number; code: string; description: string }> = []

    if (!existingNames.has("Standard Shipping")) {
      toCreate.push({ name: "Standard Shipping", amount: regionConfig.standardShipping, code: "standard", description: "5-7 business days" })
    }
    if (!existingNames.has("Express Shipping")) {
      toCreate.push({ name: "Express Shipping", amount: regionConfig.expressShipping, code: "express", description: "1-2 business days" })
    }

    if (toCreate.length > 0) {
      await createShippingOptionsWorkflow(container).run({
        input: toCreate.map((opt) => ({
          name: opt.name,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zone.id as string,
          shipping_profile_id: shippingProfile.id as string,
          type: { label: opt.name, description: opt.description, code: opt.code },
          prices: [{ currency_code: regionConfig.currency_code, amount: opt.amount }],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        })),
      })
    }
  }
  logger.info("Seeded shipping options")

  // ── Link Stock Location → Sales Channel ───────────────────────────────

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id as string, add: [defaultSalesChannelId] },
  })

  // ── Dynamic Pricing Products ──────────────────────────────────────────

  logger.info("Seeding dynamic pricing products...")
  const { result: seedResult } = await seedProductsWorkflow(container).run({})

  if (seedResult.created_product_ids?.length) {
    await link.create(
      seedResult.created_product_ids.map((productId: string) => ({
        [Modules.PRODUCT]: { product_id: productId },
        [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannelId },
      }))
    )
    logger.info(`Linked ${seedResult.created_product_ids.length} products to sales channel`)
  }

  logger.info(
    `Seeded ${seedResult.created_products.length} products, ` +
    `${seedResult.pricing_rules.length} pricing rules, ` +
    `${seedResult.categories.length} categories`
  )

  // ── FX Rates ──────────────────────────────────────────────────────────

  const dynamicPricingService = container.resolve<DynamicPricingServiceLike>(DYNAMIC_PRICING_MODULE)
  const existingRates = await dynamicPricingService.getLatestRates("USD")
  const existingToCurrencies = new Set(existingRates.map((r) => (r.to_currency as string).toUpperCase()))
  const missingRates = FX_RATES_FROM_USD.filter((r) => !existingToCurrencies.has(r.to_currency.toUpperCase()))
  if (missingRates.length > 0) {
    await dynamicPricingService.bulkCreateRates(missingRates)
    logger.info(`Seeded ${missingRates.length} missing FX rates`)
  } else {
    logger.info("All FX rates already seeded — skipping")
  }
}
