import { MetadataRoute } from "next"
import { absoluteUrl } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/checkout", "/*/account", "/*/cart", "/*/order/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
