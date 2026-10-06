import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import StructuredData from "./StructuredData";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

// Runs before first paint: restores the saved theme (dark by default) and
// flags JS availability so scroll-reveal content stays visible without JS.
const themeInitScript = `(function(){var d=document.documentElement;d.classList.add("js");try{if(localStorage.getItem("theme")==="light")d.classList.remove("dark")}catch(e){}})()`;

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="icon" href="/fluctum-logo-square.svg" type="image/svg+xml" />
        <StructuredData />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="2ff4ceee-0a6a-4df6-a7d5-8da593de3cae"
        />
        {RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
