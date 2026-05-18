import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import type { DynamicPricingOptions } from "@u11d/dynamic-pricing-plugin";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

// Placeholder provider — will be replaced with randomProvider in Step 2
const placeholderProvider: DynamicPricingOptions["provider"] = async (
  materials
) => {
  return materials.map((material) => ({
    material,
    ask: 1000,
    bid: 990,
    price: 995,
  }));
};

const dynamicPricingOptions: DynamicPricingOptions = {
  materials: ["XAU", "XAG"],
  fetchIntervalSeconds: 10,
  priceLockDurationSeconds: 120,
  provider: placeholderProvider,
};

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@u11d/dynamic-pricing-plugin/modules/dynamic-pricing",
      options: dynamicPricingOptions,
    },
  ],
});
