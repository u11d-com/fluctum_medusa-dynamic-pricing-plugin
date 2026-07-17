"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Button, IconButton, Text, clx } from "@modules/common/components/ui"
import React, { Fragment, useMemo } from "react"
import { useTranslations } from "next-intl"

import useToggleState from "@lib/hooks/use-toggle-state"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()
  const t = useTranslations("product")

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  // Sort option values by variant weight (ascending) for the "Weight" option
  const sortedOptions = useMemo(() => {
    if (!product.options?.length) return product.options ?? []

    return product.options.map((option) => {
      if (option.title !== "Weight") return option

      const weightMap = new Map<string, number>()
      for (const v of product.variants ?? []) {
        const optVal = v.options?.find((o) => o.option_id === option.id)?.value
        if (optVal && v.weight != null) weightMap.set(optVal, v.weight)
      }

      const sortedValues = [...(option.values ?? [])].sort((a, b) => {
        return (weightMap.get(a.value) ?? 0) - (weightMap.get(b.value) ?? 0)
      })

      return { ...option, values: sortedValues }
    })
  }, [product.options, product.variants])

  return (
    <>
      <div
        className={clx("lg:hidden inset-x-0 bottom-0 fixed z-50", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          // @ts-expect-error - headlessui Transition `as` prop typing conflicts with React 19.2 types
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="bg-ui-bg-base flex flex-col gap-y-3 justify-center items-center text-large-regular p-4 h-full w-full border-t border-ui-border-base"
            data-testid="mobile-actions"
          >
            <div className="flex items-center gap-x-2">
              <span data-testid="mobile-title">{product.title}</span>
              <span>—</span>
              {selectedPrice ? (
                <div className="flex items-end gap-x-2 text-ui-fg-base">
                  {selectedPrice.price_type === "sale" && (
                    <Text>
                      <Text
                        as="span"
                        className="line-through text-small-regular"
                      >
                        {selectedPrice.original_price}
                      </Text>
                    </Text>
                  )}
                  <span
                    className={clx({
                      "text-ui-fg-interactive":
                        selectedPrice.price_type === "sale",
                    })}
                  >
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            <div
              className={clx("grid grid-cols-2 w-full gap-x-4", {
                "!grid-cols-1": isSimple,
              })}
            >
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="w-full"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {variant
                        ? Object.values(options).join(" / ")
                        : t("selectOptions")}
                    </span>
                    <ChevronDown />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="w-full"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant
                  ? t("selectVariant")
                  : !inStock
                    ? t("outOfStock")
                    : t("addToCart")}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      {/* @ts-expect-error - headlessui Transition `as` prop typing conflicts with React 19.2 types */}
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            // @ts-expect-error - headlessui Transition `as` prop typing conflicts with React 19.2 types
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-700 bg-opacity-75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed bottom-0 inset-x-0">
            <div className="flex min-h-full h-full items-center justify-center text-center">
              <Transition.Child
                // @ts-expect-error - headlessui Transition `as` prop typing conflicts with React 19.2 types
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel
                  className="w-full h-full transform overflow-hidden text-left flex flex-col gap-y-3"
                  data-testid="mobile-actions-modal"
                >
                  <div className="w-full flex justify-end pr-6">
                    <IconButton
                      type="button"
                      onClick={close}
                      aria-label={t("closeOptions")}
                      className="bg-ui-bg-base w-12 h-12 rounded-full text-ui-fg-base flex justify-center items-center"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </IconButton>
                  </div>
                  <div className="bg-ui-bg-base px-6 py-12">
                    {(product.variants?.length ?? 0) > 1 && (
                      <div className="flex flex-col gap-y-6">
                        {(sortedOptions || []).map((option) => {
                          return (
                            <div key={option.id}>
                              <OptionSelect
                                option={option}
                                current={options[option.id]}
                                updateOption={updateOptions}
                                title={option.title ?? ""}
                                disabled={optionsDisabled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
