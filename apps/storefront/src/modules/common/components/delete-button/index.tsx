"use client"

import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
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
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => handleDelete(id)}
        disabled={isDeleting}
        data-testid={dataTestId}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
