// Single source of truth for the FAQ content shown in the visible page
// section (HomeClient.tsx) and mirrored in the FAQPage JSON-LD
// (StructuredData.tsx). Keep both in sync by editing only this file.
export const faqs = [
  {
    question: "What is Fluctum?",
    answer:
      "Fluctum is an open-source dynamic pricing plugin for Medusa that streams live spot prices to your storefront over Server-Sent Events and locks the price a customer sees the moment they enter checkout, so it stays valid through order completion.",
  },
  {
    question: "Is Fluctum free and open source?",
    answer:
      "Yes. Fluctum is MIT-licensed and published as @u11d/medusa-dynamic-pricing on npm. You can install it, read the source, and self-host it without any license fees.",
  },
  {
    question: "How does Fluctum keep prices in sync with the market?",
    answer:
      "A scheduled job fetches ask, bid, and spot prices from a configurable provider (GoldAPI.io, your ERP, or a custom feed) at whatever interval you set, then broadcasts every update to connected storefronts over a single SSE connection.",
  },
  {
    question: "What happens to the price when a customer checks out?",
    answer:
      "When a shopper enters checkout, Fluctum locks the price using the latest spot price stored in your database for a configurable window (for example 10 minutes), then validates the lock still exists and hasn't expired before the order completes.",
  },
  {
    question: "Does Fluctum ever override Medusa's own prices?",
    answer:
      "No. Fluctum never writes to Medusa's price tables. Final prices are computed on the frontend from the live spot price and each variant's pricing rule, keeping Medusa's core pricing engine untouched.",
  },
  {
    question: "What industries is Fluctum built for?",
    answer:
      "Fluctum was built for precious metals dealers (gold, silver) but fits any catalog where prices move constantly - industrial metals, FX-sensitive goods, and B2B catalogs driven by an ERP feed.",
  },
  {
    question: "How do I deploy Fluctum?",
    answer:
      "Deploy on Medusa Cloud for one-click managed hosting, or self-host on your own AWS, GCP, or bare-metal infrastructure using the open-source backend and storefront starters.",
  },
  {
    question:
      "Every few seconds our spot prices change - won't re-fetching prices for each shopper overload our servers?",
    answer:
      "No. A single scheduled job fetches spot prices once per interval and broadcasts every update to all connected storefronts over one Server-Sent Events connection, so server load stays flat no matter how many shoppers are browsing.",
  },
  {
    question:
      "Could a customer exploit a slow checkout to lock in a price from before the market moved against us?",
    answer:
      "No. Price locks are created from the latest spot price the moment checkout starts and are re-validated at order completion, so neither the buyer nor the seller can benefit from a stale price slipping through.",
  },
  {
    question:
      "We already run Medusa with promotions, multi-currency, and custom tax rules - do we have to rebuild any of that for live pricing?",
    answer:
      "No. Fluctum is a Medusa plugin, not a replacement backend. It layers real-time pricing and price locks on top of your existing store, so promotions, multi-region, multi-currency, and tax setup keep working exactly as before.",
  },
  {
    question:
      "Our storefront isn't built in Next.js - will dynamic pricing lock us into a specific frontend framework?",
    answer:
      "No. The plugin exposes plain HTTP and SSE endpoints, so any frontend - Next.js, SvelteKit, Vue, React Native, or a custom kiosk UI - can consume live prices the same way our reference storefront does.",
  },
  {
    question:
      "Spot prices are quoted in USD but we sell in multiple currencies - how do we avoid manual FX conversion errors?",
    answer:
      "An optional currency conversion module refreshes FX rates on a schedule and applies them automatically the moment prices are locked, so checkout totals convert consistently without manual spreadsheets.",
  },
] as const;
