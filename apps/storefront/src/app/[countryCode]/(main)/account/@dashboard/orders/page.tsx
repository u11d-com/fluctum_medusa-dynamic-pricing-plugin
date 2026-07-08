import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import { Divider, Heading, Text } from "@modules/common/components/ui"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()
  const t = await getTranslations('account')

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <Heading level="h1" size="lg">{t('ordersTitle')}</Heading>
        <Text>
          {t('ordersDescription')}
        </Text>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <Divider className="mb-8 mt-8" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
