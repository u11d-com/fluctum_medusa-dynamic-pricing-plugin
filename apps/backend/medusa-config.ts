import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import { randomProvider, createGoldApiProvider } from "@u11d/dynamic-pricing-plugin"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  plugins: [
    {
      resolve: "@u11d/dynamic-pricing-plugin",
      options: {
        materials: ["XAU", "XAG"],
        fetchIntervalSeconds: 10,
        priceLockDurationSeconds: 10 * 60,
        provider: process.env.GOLD_API_KEY
          ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
          : randomProvider,
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        workerOptions: { concurrency: 1 },
      },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            id: "locking-redis",
            resolve: "@medusajs/medusa/locking-redis",
            is_default: true,
            options: { redisUrl: process.env.REDIS_URL },
          },
        ],
      },
    },
  ],
})
