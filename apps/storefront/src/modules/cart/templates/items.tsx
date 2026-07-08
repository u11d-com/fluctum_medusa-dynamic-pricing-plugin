"use client"

import { useCart } from "@modules/cart/context/cart-context"
import repeat from "@lib/util/repeat"
import { sortByCreatedAtDesc } from "@lib/util/line-item"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"
import { useTranslations } from "next-intl"
import EmptyCartMessage from "../components/empty-cart-message"
import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const { cart: contextCart } = useCart()
  const effectiveCart = contextCart ?? cart
  const items = effectiveCart?.items
  const currencyCode = effectiveCart?.currency_code ?? "usd"
  const t = useTranslations("cart")

  if (items !== undefined && items.length === 0) {
    return <EmptyCartMessage />
  }

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading size="2xl">{t("title")}</Heading>
      </div>
      <Table>
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">{t("itemHeader")}</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>{t("quantityHeader")}</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              {t("priceHeader")}
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              {t("total")}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? sortByCreatedAtDesc(items).map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    cart={effectiveCart}
                    currencyCode={currencyCode}
                  />
                )
              })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
