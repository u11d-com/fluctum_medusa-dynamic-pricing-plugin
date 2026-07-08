import { Container, Heading, Text } from "@modules/common/components/ui"
import { getTranslations } from "next-intl/server"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = async ({ customer, orders }: OverviewProps) => {
  const t = await getTranslations("account")
  return (
    <div data-testid="overview-page-wrapper">
      <div className="hidden small:block">
        <div className="flex justify-between items-center mb-4">
          <Text as="span" className="text-xl-semi" data-testid="welcome-message" data-value={customer?.first_name}>
            {t('hello', { name: customer?.first_name ?? '' })}
          </Text>
          <Text as="span" variant="muted">
            {t('signedInAs')}{" "}
            <Text
              as="span"
              className="font-semibold"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </Text>
          </Text>
        </div>
        <div className="flex flex-col py-8 border-t border-ui-border-base">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="flex items-start gap-x-16 mb-6">
              <div className="flex flex-col gap-y-4">
                <Heading level="h3" size="md">{t('profile')}</Heading>
                <div className="flex items-end gap-x-2">
                  <Text
                    as="span"
                    className="text-3xl-semi leading-none"
                    data-testid="customer-profile-completion"
                    data-value={getProfileCompletion(customer)}
                  >
                    {getProfileCompletion(customer)}%
                  </Text>
                  <Text as="span" variant="muted" className="uppercase">
                    {t('completed')}
                  </Text>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <Heading level="h3" size="md">{t('addresses')}</Heading>
                <div className="flex items-end gap-x-2">
                  <Text
                    as="span"
                    className="text-3xl-semi leading-none"
                    data-testid="addresses-count"
                    data-value={customer?.addresses?.length || 0}
                  >
                    {customer?.addresses?.length || 0}
                  </Text>
                  <Text as="span" variant="muted" className="uppercase">
                    {t('saved')}
                  </Text>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <Heading level="h3" size="md">{t('recentOrders')}</Heading>
              </div>
              <ul
                className="flex flex-col gap-y-4"
                data-testid="orders-wrapper"
              >
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    return (
                      <li
                        key={order.id}
                        data-testid="order-wrapper"
                        data-value={order.id}
                      >
                        <LocalizedClientLink
                          href={`/account/orders/details/${order.id}`}
                        >
                          <Container className="bg-gray-50 flex justify-between items-center p-4">
                            <div className="grid grid-cols-3 grid-rows-2 gap-x-4 flex-1">
                              <Text as="span" className="font-semibold" variant="muted">{t('orderDate')}</Text>
                              <Text as="span" className="font-semibold" variant="muted">
                                {t('orderNumber')}
                              </Text>
                              <Text as="span" className="font-semibold" variant="muted">
                                {t('orderTotal')}
                              </Text>
                              <Text as="span" data-testid="order-created-date" variant="muted">
                                {new Date(order.created_at).toDateString()}
                              </Text>
                              <Text
                                as="span"
                                data-testid="order-id"
                                data-value={order.display_id}
                                className="text-small-regular"
                              >
                                #{order.display_id}
                              </Text>
                              <Text as="span" data-testid="order-amount" variant="muted">
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </Text>
                            </div>
                            <button
                              className="flex items-center justify-between"
                              data-testid="open-order-button"
                            >
                              <span className="sr-only">
                                {t('goToOrder', { id: order.display_id ?? '' })}
                              </span>
                              <ChevronDown className="-rotate-90" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <Text as="span" data-testid="no-orders-message">{t('noOrders')}</Text>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
