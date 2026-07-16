import type { Metadata } from "next";
import { Lato } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fluctum.io"),
  title: "Fluctum | Real-Time Dynamic Pricing Plugin for Medusa",
  description:
    "Fluctum is an open-source dynamic pricing plugin for Medusa stores. Stream live spot prices with SSE and lock checkout prices using the latest database snapshot.",
  keywords: [
    "Medusa dynamic pricing",
    "real-time pricing",
    "dynamic pricing plugin",
    "SSE pricing",
    "price lock checkout",
    "gold and silver ecommerce",
    "precious metals Medusa",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fluctum | Real-Time Dynamic Pricing Plugin for Medusa",
    description:
      "Open-source Medusa plugin for live spot pricing, SSE updates, and checkout price locks.",
    url: "https://fluctum.io",
    siteName: "Fluctum",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluctum | Real-Time Dynamic Pricing Plugin for Medusa",
    description:
      "Live dynamic pricing for Medusa stores with SSE updates and checkout price locks.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/fluctum-logo-full.svg" type="image/svg+xml" />
      </head>
      <body className={`${lato.variable} antialiased`}>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="2ff4ceee-0a6a-4df6-a7d5-8da593de3cae"
        />
        {children}
      </body>
    </html>
  );
}
