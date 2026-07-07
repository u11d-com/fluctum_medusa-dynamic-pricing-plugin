import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@modules/common/components/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          as="span"
          className="text-sm font-medium text-ui-fg-base"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <div className="!pr-0 flex flex-col items-end h-full justify-center">
          <div className="flex gap-x-1 ">
            <Text as="span" variant="muted">
              <Text as="span" data-testid="product-quantity">{item.quantity}</Text>x{" "}
            </Text>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>

          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            price={item.total ?? 0}
          />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
