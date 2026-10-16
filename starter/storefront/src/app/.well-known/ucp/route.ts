import { NextResponse } from "next/server"
import { absoluteUrl } from "@lib/util/env"

const UCP_VERSION = "2026-08-25"

/**
 * UCP business profile. Only capabilities this storefront actually implements
 * are declared: cart permalinks (`/buy/{variant_id}:{qty},...`). Catalog, cart,
 * checkout and order APIs are not exposed to agents yet.
 * https://ucp.dev/latest/specification/overview/
 */
export function GET() {
  return NextResponse.json(
    {
      ucp: {
        version: UCP_VERSION,
        services: {},
        capabilities: {
          "dev.ucp.shopping.permalink": [
            {
              version: UCP_VERSION,
              spec: `https://ucp.dev/${UCP_VERSION}/specification/permalink`,
              schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/permalink.json`,
              config: { endpoint: absoluteUrl("/buy") },
            },
          ],
        },
        payment_handlers: {},
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  )
}
