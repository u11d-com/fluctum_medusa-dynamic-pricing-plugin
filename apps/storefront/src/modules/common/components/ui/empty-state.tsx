import clsx from "clsx"
import { HTMLAttributes, ReactNode, forwardRef } from "react"
import { Heading } from "./heading"
import { Text } from "./text"

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("py-16 px-2 flex flex-col justify-center items-start", className)}
        {...props}
      >
        <Heading level="h1" variant="checkout" className="text-ui-fg-base">
          {title}
        </Heading>
        {description && (
          <Text variant="muted" className="mt-4 mb-6 max-w-[32rem]">
            {description}
          </Text>
        )}
        {action}
      </div>
    )
  }
)

EmptyState.displayName = "EmptyState"
