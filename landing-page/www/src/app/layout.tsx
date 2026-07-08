import type { Metadata } from "next";
import { Lato } from "next/font/google";
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
      <body className={`${lato.variable} antialiased`}>{children}</body>
    </html>
  );
}
