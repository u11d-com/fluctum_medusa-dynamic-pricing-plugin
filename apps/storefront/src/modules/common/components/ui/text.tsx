import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span" | "div"
  variant?:
    | "body"
    | "muted"
    | "label"
    | "caption"
    | "error"
    | "warning"
    | "success"
    | "price"
    | "eyebrow"
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  (
    { className, as: Component = "p", variant = "body", children, ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          variant === "body" && "text-base text-ui-fg-base",
          variant === "muted" && "text-sm text-ui-fg-muted",
          variant === "label" && "text-sm font-medium text-ui-fg-base",
          variant === "caption" && "text-xs text-ui-fg-muted",
          variant === "error" && "text-sm text-ui-fg-error",
          variant === "warning" && "text-sm text-tag-orange-text",
          variant === "success" && "text-sm text-tag-green-text",
          variant === "price" && "text-base font-semibold tabular-nums text-ui-fg-base",
          variant === "eyebrow" &&
            "text-xs uppercase tracking-wide font-medium text-ui-fg-subtle",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Text.displayName = "Text"
