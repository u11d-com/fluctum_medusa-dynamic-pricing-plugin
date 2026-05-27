import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { SpotPriceProvider } from "@lib/context/spot-price-context"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <SpotPriceProvider>
          <main className="relative">{props.children}</main>
        </SpotPriceProvider>
      </body>
    </html>
  )
}
