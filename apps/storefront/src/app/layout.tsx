import { Lato, Cinzel } from "next/font/google"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { SpotPriceProvider } from "@lib/context/spot-price-context"
import { Toaster } from "sonner"

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
  weight: ["300", "400", "700", "900"],
})

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["700", "800", "900"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lato.variable} ${cinzel.variable}`}>
      <body>
        <SpotPriceProvider>
          <main className="relative">{props.children}</main>
        </SpotPriceProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "rounded-xl shadow-lg border border-gray-100 text-sm",
              success: "!bg-white !text-gray-900",
              error: "!bg-white !text-gray-900",
            },
          }}
        />
      </body>
    </html>
  )
}
