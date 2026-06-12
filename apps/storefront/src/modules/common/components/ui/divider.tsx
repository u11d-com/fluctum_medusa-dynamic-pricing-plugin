import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type DividerProps = HTMLAttributes<HTMLDivElement>

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("h-px w-full border-b border-ui-border-base mt-1", className)}
        {...props}
      />
    )
  }
)

Divider.displayName = "Divider"
