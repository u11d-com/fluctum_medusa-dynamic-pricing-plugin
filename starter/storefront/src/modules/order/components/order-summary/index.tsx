import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import { getTranslations } from "next-intl/server"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = async ({ order }: OrderSummaryProps) => {
  const t = await getTranslations('order')
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div>
      <Heading level="h2" size="sm">{t('summary')}</Heading>
      <div className="my-2">
        <div className="flex items-center justify-between mb-2">
          <Text as="span">{t('subtotal')}</Text>
          <Text as="span">{getAmount(order.subtotal)}</Text>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center justify-between">
            <Text as="span" variant="muted">{t('shipping')}</Text>
            <Text as="span" variant="muted">{getAmount(order.shipping_total)}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text as="span" variant="muted">{t('tax')}</Text>
            <Text as="span" variant="muted">{getAmount(order.tax_total)}</Text>
          </div>
        </div>
        <div className="h-px w-full border-b border-ui-border-base border-dashed my-4" />
        <div className="flex items-center justify-between mb-2">
          <Text as="span">{t('total')}</Text>
          <Text as="span">{getAmount(order.total)}</Text>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
