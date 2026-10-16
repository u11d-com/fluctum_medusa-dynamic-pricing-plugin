import Image from "next/image"
import { getTranslations } from "next-intl/server"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDropdown from "@modules/layout/components/cart-dropdown"

export default async function Nav({ countryCode }: { countryCode: string }) {
  const t = await getTranslations("nav")

  return (
    <header className="h-16 mx-auto border-b duration-200 bg-black border-white/10">
      <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
        <div className="flex items-center h-full w-40">
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2.5"
            data-testid="nav-store-link"
          >
            <Image
              src="/fluctum-logo-full.svg"
              alt="fluctum"
              width={52}
              height={52}
              style={{ height: "auto" }}
            />
            <span className="font-bold text-2xl text-brand-primary tracking-wide">
              Fluctum
            </span>
          </LocalizedClientLink>
        </div>

        <div className="flex items-center gap-x-8 h-full">
          <LocalizedClientLink
            href="/"
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            data-testid="nav-home-link"
          >
            {t("home")}
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            data-testid="nav-store-link"
          >
            {t("store")}
          </LocalizedClientLink>
          <LocalizedClientLink
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            href="/account"
            data-testid="nav-account-link"
          >
            {t("account")}
          </LocalizedClientLink>
        </div>

        <div className="flex items-center h-full gap-x-4 justify-end">
          <form
            role="search"
            method="get"
            action={`/${countryCode}/search`}
            className="hidden small:flex items-center"
          >
            <label htmlFor="site-search" className="sr-only">
              {t("search")}
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              className="h-8 w-44 rounded-md bg-white/10 border border-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-primary"
              data-testid="nav-search-input"
            />
            <button type="submit" className="sr-only">
              {t("search")}
            </button>
          </form>
          <CartDropdown />
        </div>
      </nav>
    </header>
  )
}
