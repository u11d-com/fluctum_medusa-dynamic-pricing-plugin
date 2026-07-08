import clsx from "clsx"
import { ButtonHTMLAttributes, forwardRef } from "react"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-md p-2 hover:bg-ui-bg-base-hover transition-colors focus-visible:outline-none focus-visible:ring-2",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = "IconButton"
