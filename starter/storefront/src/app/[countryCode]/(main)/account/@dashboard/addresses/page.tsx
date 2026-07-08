import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"
import { Heading, Text } from "@modules/common/components/ui"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  const t = await getTranslations('account')

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h1" size="lg">{t('addressesTitle')}</Heading>
        <Text>
          {t('addressesDescription')}
        </Text>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
