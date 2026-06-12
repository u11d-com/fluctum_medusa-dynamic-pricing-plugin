"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Surface, Text, clx } from "@modules/common/components/ui"

type CheckoutStepCardProps = {
  title: string
  isOpen: boolean
  isComplete?: boolean
  canEdit?: boolean
  onEdit?: () => void
  disabled?: boolean
  children: React.ReactNode
  dataTestId?: string
}

export default function CheckoutStepCard({
  title,
  isOpen,
  isComplete,
  canEdit,
  onEdit,
  disabled,
  children,
  dataTestId,
}: CheckoutStepCardProps) {
  return (
    <Surface className="p-6" data-testid={dataTestId}>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          size="2xl"
          className={clx("flex flex-row gap-x-2 items-baseline", {
            "opacity-50 pointer-events-none select-none": disabled,
          })}
        >
          {title}
          {!isOpen && isComplete && <CheckCircleSolid />}
        </Heading>
        {!isOpen && canEdit && onEdit && (
          <Text>
            <button
              type="button"
              onClick={onEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      {children}
    </Surface>
  )
}
