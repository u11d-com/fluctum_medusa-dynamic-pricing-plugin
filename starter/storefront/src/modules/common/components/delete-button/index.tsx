"use client"

import { Spinner, Trash } from "@medusajs/icons"
import { Button, clx } from "@modules/common/components/ui"
import { useCart } from "@modules/cart/context/cart-context"
import { useTransition } from "react"

const DeleteButton = ({
  id,
  children,
  className,
  "data-testid": dataTestId,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  "data-testid"?: string
}) => {
  const [isDeleting, startTransition] = useTransition()
  const { deleteLineItem } = useCart()

  const handleDelete = (lineId: string) => {
    startTransition(async () => {
      try {
        await deleteLineItem(lineId)
      } catch {
        // deleteLineItem surfaces its own toast via medusaError; isDeleting resets when the transition ends
      }
    })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="border-transparent hover:border-transparent hover:bg-transparent text-ui-fg-subtle hover:text-ui-fg-base"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        data-testid={dataTestId}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </Button>
    </div>
  )
}

export default DeleteButton
