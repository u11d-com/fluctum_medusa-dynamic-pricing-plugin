import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Divider, Heading, Text } from "@modules/common/components/ui"
import { getTranslations } from "next-intl/server"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = async ({ order }: ShippingDetailsProps) => {
  const t = await getTranslations("order")
  const tCheckout = await getTranslations("checkout")
  return (
    <div>
      <Heading level="h2" size="2xl" className="flex flex-row my-6">
        {t("shipping")}
      </Heading>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text as="span" variant="label" className="mb-1">
            {t("shippingTo")}
          </Text>
          <Text variant="muted">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text variant="muted">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text variant="muted">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text variant="muted">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex flex-col w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text as="span" variant="label" className="mb-1">
            {tCheckout("contact")}
          </Text>
          <Text variant="muted">{order.shipping_address?.phone}</Text>
          <Text variant="muted">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text as="span" variant="label" className="mb-1">
            {tCheckout("method")}
          </Text>
          <Text variant="muted">
            {(order.shipping_methods?.[0] as { name?: string })?.name} (
            {convertToLocale({
              amount: order.shipping_methods?.[0].total ?? 0,
              currency_code: order.currency_code,
            })}
            )
          </Text>
        </div>
      </div>
    </div>
  )
}

export default ShippingDetails
