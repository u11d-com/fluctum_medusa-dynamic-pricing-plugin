import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import RecommendedProducts from "@modules/home/components/recommended-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Fluctum Demo — Dynamic Pricing for Precious Metals",
  description:
    "An open-source dynamic pricing solution for precious metals (gold, silver, platinum, palladium) built on Medusa. Real-time spot prices, fair market value, and transparent pricing.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <Hero />
      <RecommendedProducts countryCode={countryCode} />
      <div className="bg-black">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </div>
  )
}
