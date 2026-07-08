"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { sortByCreatedAtDesc } from "@lib/util/line-item"
import { Button, Heading, Surface, Text } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useCartPricing } from "@lib/hooks/use-cart-pricing"
import { useCart } from "@modules/cart/context/cart-context"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = () => {
  const { cart: cartState, regionCurrencyCode } = useCart()
  const { itemPrices, subtotal: dynamicSubtotal } = useCartPricing(cartState ?? null, regionCurrencyCode)
  const [activeTimer, setActiveTimer] = useState<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const t = useTranslations("cart")
  const tNav = useTranslations("nav")

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = dynamicSubtotal > 0 ? dynamicSubtotal : null
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="text-white/80 hover:text-white transition-colors"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <span aria-live="polite">{tNav("cart", { count: totalItems })}</span>
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+8px)] right-0 w-[400px] text-ui-fg-base"
            data-testid="nav-cart-dropdown"
          >
            <Surface variant="floating" className="overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-ui-border-base">
                <Heading level="h3" className="text-base text-ui-fg-base">{t("yourCart")}</Heading>
                <Text variant="caption">{t("itemCount", { count: totalItems })}</Text>
              </div>
              {cartState && cartState.items?.length ? (
                <>
                  <div className="overflow-y-scroll max-h-[402px] px-4 py-3 grid grid-cols-1 gap-y-6 no-scrollbar">
                  {sortByCreatedAtDesc(cartState.items).map((item) => (
                        <div
                          className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4"
                          key={item.id}
                          data-testid="cart-item"
                        >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                            className="w-24"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                         <div className="flex flex-col justify-between flex-1 min-w-0">
                           <div className="flex flex-col flex-1 gap-y-1">
                             <div className="flex items-start justify-between">
                               <div className="flex flex-col min-w-0 pr-3">
                                   <Heading
                                     level="h3"
                                     size="sm"
                                     className="text-sm font-medium text-ui-fg-base break-words leading-5"
                                   >
                                     <LocalizedClientLink
                                       href={`/products/${item.product_handle}`}
                                       data-testid="product-link"
                                     >
                                       {item.title}
                                     </LocalizedClientLink>
                                   </Heading>
                                  <LineItemOptions
                                     variant={item.variant}
                                     data-testid="cart-item-variant"
                                     data-value={item.variant}
                                     className="text-xs text-ui-fg-muted whitespace-normal break-words overflow-visible text-clip"
                                   />
                                   <Text
                                     as="span"
                                     variant="caption"
                                     data-testid="cart-item-quantity"
                                     data-value={item.quantity}
                                   >
                                     {t("quantity", { quantity: item.quantity })}
                                  </Text>
                              </div>
                               <div className="flex justify-end shrink-0">
                                 <LineItemPrice
                                   item={item}
                                   style="tight"
                                  currencyCode={cartState.currency_code}
                                  price={itemPrices[item.id]?.total}
                                />
                              </div>
                            </div>
                          </div>
                            <DeleteButton
                              id={item.id}
                              className="mt-2"
                              data-testid="cart-item-remove-button"
                            >
                              {t("remove")}
                           </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4 flex flex-col gap-y-4 border-t border-ui-border-base">
                   <div className="flex items-center justify-between">
                     <Text as="span" className="font-semibold">
                       {t("subtotalExclTaxes")}
                     </Text>
                    <Text
                      as="span"
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal ?? undefined}
                    >
                      {subtotal !== null
                        ? convertToLocale({
                            amount: subtotal,
                            currency_code: cartState.currency_code,
                          })
                        : "—"}
                    </Text>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      {t("goToCart")}
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
              ) : (
                <div>
                  <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                    <div className="bg-ui-fg-base flex items-center justify-center w-6 h-6 rounded-full text-white">
                      <Text as="span" className="text-small-regular text-white">0</Text>
                    </div>
                     <Text variant="muted">{t("shoppingBagEmpty")}</Text>
                     <div>
                       <LocalizedClientLink href="/store">
                         <>
                           <span className="sr-only">{tNav('allProducts')}</span>
                           <Button onClick={close}>{t("exploreProducts")}</Button>
                         </>
                       </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              )}
            </Surface>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
