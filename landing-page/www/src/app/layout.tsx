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
  title: "Fluctum | Real-Time Dynamic Pricing for Medusa",
  description:
    "Fluctum keeps prices live for gold, silver, or any volatile asset on your Medusa storefront.",
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
