import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Surface, Text } from "@modules/common/components/ui"
import { buttonClassName } from "@modules/common/components/ui/button"
import { getTranslations } from "next-intl/server"

const Hero = async () => {
  const t = await getTranslations("home")
  return (
    <div className="w-full">
      <div className="relative h-[70vh] min-h-[480px] flex items-center overflow-hidden bg-black">
        <Image
          src="/hero.webp"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
          className="object-cover"
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Geometric bars — trading chart style */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-end justify-end opacity-[0.07]">
          <div className="flex items-end gap-[3px] pr-12 h-3/4">
            {[
              35, 55, 25, 70, 40, 80, 30, 65, 45, 20, 75, 50, 85, 35, 60, 90,
              40, 70, 30, 80, 50, 65, 35, 75,
            ].map((h, i) => (
              <div
                key={i}
                className="w-[6px] rounded-t-sm bg-white"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 content-container flex flex-col items-start gap-8 px-6">
          <div className="max-w-2xl">
            <Heading
              level="h1"
              size="2xl"
              className="text-white md:text-[3.5rem]"
            >
              {t("heroTitle")}
            </Heading>
            <Text className="text-base md:text-lg text-white/60 mt-5 max-w-xl leading-relaxed">
              {t("heroSubtitle")}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <LocalizedClientLink href="/store">
              <Button variant="primary" size="lg" className="rounded-lg">
                {t("browseProducts")}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Button>
            </LocalizedClientLink>
            <a
              href="#how-it-works"
              className={buttonClassName({
                variant: "outline",
                size: "lg",
                className:
                  "rounded-lg border-white/20 text-white/60 hover:text-white hover:bg-white/10",
              })}
            >
              {t("howItWorks")}
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="content-container px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 overflow-hidden rounded-t-xl">
              {[
                { label: t("liveSpotPrices"), value: "XAU · XAG · XPT · XPD" },
                { label: t("refreshRate"), value: t("refreshRateValue") },
                { label: t("pricingModel"), value: t("pricingModelValue") },
                { label: t("checkoutLabel"), value: t("checkoutValue") },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-black/60 backdrop-blur-sm px-4 py-3 flex flex-col"
                >
                  <span className="text-xs text-white/50">{stat.label}</span>
                  <span className="text-sm font-medium text-white/90">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div id="how-it-works" className="content-container py-20 md:py-28 px-6">
        <div className="text-center mb-14">
          <Heading
            level="h2"
            className="text-2xl md:text-3xl font-light text-white tracking-tight"
          >
            {t("builtOnFairness")}
          </Heading>
          <Text className="text-white/50 mt-3 mx-auto font-light">
            {t("builtOnFairnessDesc")}
          </Text>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: t("liveSpotData"),
              body: t("liveSpotDataDesc"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
            {
              title: t("simpleFormula"),
              body: t("simpleFormulaDesc"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
            {
              title: t("lockedAtCheckout"),
              body: t("lockedAtCheckoutDesc"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
            },
          ].map((item) => (
            <Surface
              key={item.title}
              variant="dark"
              className="bg-neutral-900 border border-white/10 rounded-xl p-6 hover:bg-neutral-800/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand-primary flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <Heading
                level="h3"
                size="md"
                className="text-base font-medium text-white mb-2"
              >
                {item.title}
              </Heading>
              <Text className="text-sm text-white/55 leading-relaxed">
                {item.body}
              </Text>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Hero
