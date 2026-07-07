"use client"

import repeat from "@lib/util/repeat"
import { sortByCreatedAtDesc } from "@lib/util/line-item"
import { HttpTypes } from "@medusajs/types"
import { Table, clx } from "@modules/common/components/ui"
import type { LockedPriceMap } from "@u11d/medusa-dynamic-pricing/client"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart: HttpTypes.StoreCart
  lockedPrices?: LockedPriceMap | null
}

const ItemsPreviewTemplate = ({ cart, lockedPrices }: ItemsTemplateProps) => {
  const items = cart.items
  const hasOverflow = (items?.length ?? 0) > 4

  return (
    <div
      className={clx({
        "pl-[1px] overflow-y-scroll overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <Table>
        <Table.Body data-testid="items-table">
          {items
            ? sortByCreatedAtDesc(items).map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    type="preview"
                    currencyCode={cart.currency_code}
                    lockedPrice={lockedPrices?.[item.id]}
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

export default ItemsPreviewTemplate
