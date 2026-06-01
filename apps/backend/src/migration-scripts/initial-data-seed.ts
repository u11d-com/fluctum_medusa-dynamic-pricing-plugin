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
} from "@medusajs/medusa/core-flows";
import { seedProductsWorkflow } from "@u11d/dynamic-pricing-plugin";

type QueryRecord = Record<string, unknown>

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

  const europeCountries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  // ── Check what already exists ──────────────────────────────────────────

  const { data: existingSalesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const { data: existingApiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "title"],
  })
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })

  const defaultChannel = existingSalesChannels.find((s: QueryRecord) => s.name === "Default Sales Channel")

  // ── Sales Channel ──────────────────────────────────────────────────────

  let defaultSalesChannelId: string
  if (defaultChannel) {
    defaultSalesChannelId = defaultChannel.id
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

  const existingKey = existingApiKeys.find((k: QueryRecord) => k.title === "Default Publishable API Key")
  let publishableKeyId: string
  if (existingKey) {
    publishableKeyId = existingKey.id
    logger.info(`Using existing API key: ${existingKey.token.substring(0, 20)}...`)
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
    logger.info(`Created API key`)
  }

  // Link API key to sales channel (idempotent — checks internally)
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKeyId, add: [defaultSalesChannelId] },
  })
  logger.info("API key linked to sales channel")

  // ── Store ──────────────────────────────────────────────────────────────

  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id", "name"],
  })
  if (existingStores.length > 0) {
    logger.info(`Using existing store: ${existingStores[0].name}`)
  } else {
    await createStoresWorkflow(container).run({
      input: {
        stores: [{
          name: "Default Store",
          supported_currencies: [
            { currency_code: "usd", is_default: true },
            { currency_code: "eur", is_default: false },
          ],
          default_sales_channel_id: defaultSalesChannelId,
        }],
      },
    })
    logger.info("Created Default Store")
  }

  // ── Regions ────────────────────────────────────────────────────────────

  let usRegion: QueryRecord, region: QueryRecord
  if (existingRegions.length > 0) {
    usRegion = existingRegions.find((r: QueryRecord) => r.currency_code === "usd")
    region = usRegion || existingRegions[0]
    logger.info(`Using existing regions`)
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          { name: "United States", currency_code: "usd", countries: ["us"], payment_providers: ["pp_system_default"] },
          { name: "Europe", currency_code: "eur", countries: europeCountries, payment_providers: ["pp_system_default"] },
        ],
      },
    })
    usRegion = regionResult.find((r: QueryRecord) => r.currency_code === "usd")
    region = usRegion || regionResult[0]
    logger.info("Created regions")
  }

  // ── Tax Regions ────────────────────────────────────────────────────────

  try {
    await createTaxRegionsWorkflow(container).run({
      input: [...europeCountries, "us"].map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    })
    logger.info("Finished seeding tax regions.")
  } catch {
    logger.info("Tax regions already exist — skipping.")
  }

  // ── Stock Location + Fulfillment ───────────────────────────────────────

  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  let stockLocation: QueryRecord = existingLocations.find((l: QueryRecord) => l.name === "Main Warehouse")

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
    stockLocation = slResult[0]
    logger.info("Created stock location")
  }

  // Fulfillment provider link (idempotent — link.create checks)
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  // ── Fulfillment Set + Shipping Options ─────────────────────────────────

  const { data: existingShippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = existingShippingProfiles[0]

  const { data: existingSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name"],
  })
  let fulfillmentSet: QueryRecord = existingSets.find((s: QueryRecord) => s.name === "Main Warehouse delivery")

  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Main Warehouse delivery",
      type: "shipping",
      service_zones: [{
        name: "United States",
        geo_zones: [{ country_code: "us", type: "country" }],
      }],
    })
    logger.info("Created fulfillment set")
  } else {
    logger.info("Using existing fulfillment set")
  }

  // Link stock location → fulfillment set (idempotent — link module uses ON CONFLICT DO NOTHING)
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  // Create shipping options (idempotent — check by name)
  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })
  const standardOption = existingOptions.find((o: QueryRecord) => o.name === "Standard Shipping")
  if (!standardOption) {
    const serviceZoneId = fulfillmentSet.service_zones?.[0]?.id ?? fulfillmentSet.id

    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "Ship in 2-3 days.", code: "standard" },
        prices: [
          { currency_code: "usd", amount: 10 },
          { currency_code: "eur", amount: 10 },
          { region_id: region.id, amount: 10 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }, {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Express", description: "Ship in 24 hours.", code: "express" },
        prices: [
          { currency_code: "usd", amount: 10 },
          { currency_code: "eur", amount: 10 },
          { region_id: region.id, amount: 10 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    })
    logger.info("Created shipping options")
  } else {
    logger.info("Using existing shipping options")
  }

  // ── Link Stock Location → Sales Channel ───────────────────────────────

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [defaultSalesChannelId] },
  })

  // ── Dynamic Pricing Products ──────────────────────────────────────────

  logger.info("Seeding dynamic pricing products...");
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
}
