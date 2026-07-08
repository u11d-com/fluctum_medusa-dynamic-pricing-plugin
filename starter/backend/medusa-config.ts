import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import {
  randomProvider,
  createGoldApiProvider,
  createStaticRatesProvider,
} from "@u11d/medusa-dynamic-pricing";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isTest = process.env.NODE_ENV === "test";

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis not needed in test — avoids BullMQ teardown noise in integration tests
    redisUrl: isTest ? undefined : process.env.REDIS_URL,
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
      resolve: "@u11d/medusa-dynamic-pricing",
      options: {
        materials: ["XAU", "XAG", "XPT", "XPD"],
        fetchIntervalSeconds: 10,
        priceLockDurationSeconds: 10 * 60,
        provider: process.env.GOLD_API_KEY
          ? createGoldApiProvider({ apiKey: process.env.GOLD_API_KEY })
          : randomProvider,
        pricingCurrency: "USD",
        currencyConversion: {
          provider: createStaticRatesProvider({
            rates: {
              CAD: 1.36, MXN: 18.5, BRL: 5.1, ARS: 1000,
              EUR: 0.92, GBP: 0.79, DKK: 6.85, SEK: 10.4,
              PLN: 4.0, CZK: 23.0, HUF: 355, RON: 4.58,
              NGN: 1550, ZAR: 18.2, JPY: 155, KRW: 1370,
              AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31,
            },
          }),
          refreshIntervalSeconds: 3600,
          targetCurrencies: [
            "CAD", "MXN", "BRL", "ARS", "EUR", "GBP", "DKK", "SEK",
            "PLN", "CZK", "HUF", "RON", "NGN", "ZAR", "JPY", "KRW",
            "AED", "SAR", "QAR", "KWD",
          ],
        },
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {},
    },
    ...(isTest
      ? []
      : [
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
        ]),
  ],
});
