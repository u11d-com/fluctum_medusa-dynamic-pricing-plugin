"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Button, ChoiceCard, Divider, Radio as SelectionRadio, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import CheckoutStepCard from "../checkout-step-card"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

type FulfillmentSet = {
  type?: string
  location?: {
    address?: HttpTypes.StoreCartAddress
  }
}

type ShippingOptionWithFulfillmentSet = HttpTypes.StoreCartShippingOption & {
  service_zone?: {
    fulfillment_set?: FulfillmentSet
  }
}

function isPickupOption(option: HttpTypes.StoreCartShippingOption): boolean {
  const shippingOption = option as ShippingOptionWithFulfillmentSet
  return shippingOption.service_zone?.fulfillment_set?.type === "pickup"
}

function getPickupAddress(
  option: HttpTypes.StoreCartShippingOption
): HttpTypes.StoreCartAddress | undefined {
  const shippingOption = option as ShippingOptionWithFulfillmentSet
  return shippingOption.service_zone?.fulfillment_set?.location?.address
}

function formatAddress(address?: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingMethod, setIsSettingMethod] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (shippingMethod) => !isPickupOption(shippingMethod)
  )

  const _pickupMethods = availableShippingMethods?.filter((shippingMethod) =>
    isPickupOption(shippingMethod)
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    setIsLoading(true)
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsSettingMethod(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsSettingMethod(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <CheckoutStepCard
      title="Delivery"
      isOpen={isOpen}
      isComplete={!isOpen && (cart.shipping_methods?.length ?? 0) > 0}
      disabled={!isOpen && cart.shipping_methods?.length === 0}
      canEdit={
        !isOpen &&
        !!cart?.shipping_address &&
        !!cart?.billing_address &&
        !!cart?.email
      }
      onEdit={handleEdit}
      dataTestId="checkout-delivery-step"
    >
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <Text as="span" variant="label">
                Shipping method
              </Text>
              <Text as="span" variant="muted" className="mb-4">
                How would you like you order delivered
              </Text>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={() => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className="mb-3"
                    >
                      <ChoiceCard
                        selected={showPickupOptions === PICKUP_OPTION_ON}
                        className="w-full flex items-center justify-between cursor-pointer py-4 px-8"
                      >
                        <div className="flex items-center gap-x-4">
                            <SelectionRadio
                              checked={showPickupOptions === PICKUP_OPTION_ON}
                            />
                          <Text as="span">
                            Pick up your order
                          </Text>
                        </div>
                        <Text as="span" className="justify-self-end">
                          -
                        </Text>
                      </ChoiceCard>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className="mb-3"
                      >
                        <ChoiceCard
                          selected={option.id === shippingMethodId}
                          disabled={isDisabled}
                          className="w-full flex items-center justify-between cursor-pointer py-4 px-8"
                        >
                          <div className="flex items-center gap-x-4">
                            <SelectionRadio
                              checked={option.id === shippingMethodId}
                            />
                            <Text as="span">
                              {option.name}
                            </Text>
                          </div>
                          <Text as="span" className="justify-self-end">
                            {option.price_type === "flat" ? (
                              convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })
                            ) : calculatedPricesMap[option.id] ? (
                              convertToLocale({
                                amount: calculatedPricesMap[option.id],
                                currency_code: cart?.currency_code,
                              })
                            ) : isLoadingPrices ? (
                              <Loader />
                            ) : (
                              "-"
                            )}
                          </Text>
                        </ChoiceCard>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <Text as="span" variant="label">
                  Store
                </Text>
                <Text as="span" variant="muted" className="mb-4">
                  Choose a store near you
                </Text>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className="mb-3"
                        >
                          <ChoiceCard
                            selected={option.id === shippingMethodId}
                            disabled={option.insufficient_inventory}
                            className="w-full flex items-center justify-between cursor-pointer py-4 px-8"
                          >
                            <div className="flex items-start gap-x-4">
                              <SelectionRadio
                                checked={option.id === shippingMethodId}
                              />
                              <div className="flex flex-col">
                                <Text as="span">
                                  {option.name}
                                </Text>
                                <Text as="span" variant="muted">
                                  {formatAddress(getPickupAddress(option))}
                                </Text>
                              </div>
                            </div>
                            <Text as="span" className="justify-self-end">
                              {convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })}
                            </Text>
                          </ChoiceCard>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt-2"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!shippingMethodId || isSettingMethod}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div>
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text as="span" variant="label" className="mb-1">
                  Method
                </Text>
                <Text variant="muted">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </CheckoutStepCard>
  )
}

export default Shipping
