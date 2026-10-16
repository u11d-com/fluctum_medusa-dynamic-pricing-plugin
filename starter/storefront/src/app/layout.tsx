import { Lato } from "next/font/google"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { SpotPriceProvider } from "@lib/context/spot-price-context"
import { Toaster } from "sonner"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
  weight: ["300", "400", "700", "900"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    // `data-scroll-behavior` lets Next.js turn off the global smooth scrolling
    // during route changes, so new pages open at the top instead of mid-animation.
    <html
      lang={locale}
      className={`${lato.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="icon" href="/fluctum-logo-full.svg" type="image/svg+xml" />
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SpotPriceProvider>
            {props.children}
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
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
