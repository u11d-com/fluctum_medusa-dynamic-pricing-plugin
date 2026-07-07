import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDropdown from "@modules/layout/components/cart-dropdown"

export default async function Nav() {
  return (
    <header className="sticky top-0 inset-x-0 z-50 h-16 mx-auto border-b duration-200 bg-black border-white/10">
      <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
        <div className="flex items-center h-full">
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
            <span className="font-cinzel font-bold text-2xl text-brand-primary tracking-wide">
              fluctum
            </span>
          </LocalizedClientLink>
        </div>

        <div className="flex items-center gap-x-8 h-full">
          <LocalizedClientLink
            href="/"
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            data-testid="nav-home-link"
          >
            Home
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/store"
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            data-testid="nav-store-link"
          >
            Store
          </LocalizedClientLink>
          <LocalizedClientLink
            className="text-white/80 hover:text-white transition-colors txt-compact-plus"
            href="/account"
            data-testid="nav-account-link"
          >
            Account
          </LocalizedClientLink>
        </div>

        <div className="flex items-center h-full">
          <CartDropdown />
        </div>
      </nav>
    </header>
  )
}
