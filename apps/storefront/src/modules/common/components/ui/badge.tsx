import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: "green" | "red" | "blue" | "orange" | "grey" | "purple"
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color = "grey", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          color === "green" && "bg-tag-green-bg text-tag-green-text",
          color === "red" && "bg-tag-red-bg text-tag-red-text",
          color === "blue" && "bg-tag-blue-bg text-tag-blue-text",
          color === "orange" && "bg-tag-orange-bg text-tag-orange-text",
          color === "grey" && "bg-tag-neutral-bg text-tag-neutral-text",
          color === "purple" && "bg-tag-purple-bg text-tag-purple-text",
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = "Badge"
