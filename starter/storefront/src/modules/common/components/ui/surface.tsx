import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "card" | "muted" | "dark" | "floating" | "section"
  padded?: boolean
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant = "card", padded = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          variant === "card" && "surface-card",
          variant === "muted" && "surface-muted",
          variant === "dark" && "surface-dark",
          variant === "floating" && "surface-floating",
          variant === "section" && "bg-ui-bg-subtle border border-ui-border-base rounded-xl",
          padded && "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Surface.displayName = "Surface"
