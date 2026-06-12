import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import SpotPriceBarClient from "@modules/spot-prices/components/spot-price-bar.client"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-gray-50 relative small:min-h-screen">
      <SpotPriceBarClient />
      <div className="h-16 bg-black border-b border-white/10">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-white/70 flex items-center gap-x-2 uppercase flex-1 basis-0 hover:text-white transition-colors"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus hover:text-white">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus hover:text-white">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2"
            data-testid="store-link"
          >
            <Image
              src="/fluctum-logo-full.svg"
              alt="fluctum"
              width={28}
              height={28}
            />
            <span className="font-cinzel font-bold text-sm text-brand-primary hover:text-brand-hover tracking-wide">
              fluctum
            </span>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
