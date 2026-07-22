import { Heading, Surface } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const t = await getTranslations("order")
  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <Surface
          className="flex flex-col gap-y-6 max-w-4xl h-full w-full p-6"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            size="xl"
            className="flex flex-col gap-y-3 text-ui-fg-base mb-4"
          >
            <span>{t("thankYou")}</span>
            <span>{t("orderPlaced")}</span>
          </Heading>
          <OrderDetails order={order} />
          <Heading level="h2" size="2xl" className="flex flex-row">
            {t("summary")}
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
        </Surface>
      </div>
    </div>
  )
}
