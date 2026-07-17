import type { ReactElement } from "react"
import Image from "next/image"
import { Text } from "@modules/common/components/ui"
import { getTranslations } from "next-intl/server"
import { listRegions } from "@lib/data/regions"
import CountrySelect from "@modules/layout/components/country-select"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const regions = await listRegions()
  const t = await getTranslations("footer")

  return (
    <footer className="border-t border-white/10 w-full bg-black">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col small:flex-row small:items-start small:justify-between gap-10 py-16">
          <div className="flex flex-col gap-y-6 max-w-[260px]">
            <LocalizedClientLink href="/" className="flex items-center gap-3">
              <Image
                src="/fluctum-logo-full.svg"
                alt="fluctum"
                width={56}
                height={56}
                style={{ height: "auto" }}
              />
              <span className="font-cinzel font-bold text-xl text-brand-primary tracking-wide">
                fluctum
              </span>
            </LocalizedClientLink>
            <Text as="p" className="text-xs text-white/40 leading-relaxed">
              {t("tagline")}
            </Text>
          </div>

          <div className="flex flex-col gap-y-3">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
              {t("poweredBy")}
            </span>
            <a
              href="https://medusajs.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              Medusa
            </a>
          </div>

          <div className="flex flex-col gap-y-3">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
              {t("openSource")}
            </span>
            <a
              href="https://github.com/anomalyco/dynamic-pricing"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              {t("githubRepository")}
            </a>
          </div>

          <div className="flex flex-col gap-y-3">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
              {t("region")}
            </span>
            <CountrySelect regions={regions ?? []} />
          </div>
        </div>

        <div className="flex w-full mb-10 justify-center items-center border-t border-white/10 pt-6">
          <Text className="txt-compact-small text-white/20 text-[11px]">
            {
              t.rich("madeBy", {
                link: () => (
                  <a
                    href="https://u11d.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-white/50"
                  >
                    u11d
                  </a>
                ),
              }) as ReactElement
            }
          </Text>
        </div>
      </div>
    </footer>
  )
}
