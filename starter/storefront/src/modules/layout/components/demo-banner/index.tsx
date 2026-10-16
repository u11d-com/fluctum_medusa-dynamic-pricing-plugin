import { getTranslations } from "next-intl/server"
import { BUILDER, FRAMEWORK_URL } from "@lib/store-policies"

/** Sitewide notice that this storefront is a demo, not a real shop. */
export default async function DemoBanner() {
  const t = await getTranslations("common")

  return (
    <div
      role="note"
      aria-label="Demo store notice"
      className="bg-brand-primary text-white text-xs text-center px-4 py-1.5"
      data-testid="demo-banner"
    >
      {t.rich("demoBanner", {
        fluctum: (chunks) => (
          <a href={FRAMEWORK_URL} className="underline font-semibold">
            {chunks}
          </a>
        ),
        u11d: (chunks) => (
          <a href={BUILDER.url} className="underline font-semibold">
            {chunks}
          </a>
        ),
      })}
    </div>
  )
}
