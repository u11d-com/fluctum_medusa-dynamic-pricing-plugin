import clsx from "clsx"
import { ButtonHTMLAttributes, forwardRef } from "react"

const normalizeButtonSize = (
  size: ButtonSize | "small" | "medium" | "large",
) => {
  if (size === "small") return "xs"
  if (size === "medium") return "sm"
  if (size === "large") return "md"
  return size
}

export const buttonClassName = ({
  variant = "primary",
  size = "sm",
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize | "small" | "medium" | "large"
  className?: string
}) => {
  const normalizedSize = normalizeButtonSize(size)

  return clsx(
    "inline-flex gap-2 items-center justify-center rounded-md font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" &&
      "bg-brand-primary text-white hover:bg-brand-hover shadow-sm",
    variant === "secondary" &&
      "bg-ui-bg-base text-ui-fg-base border border-ui-border-base hover:bg-ui-bg-base-hover",
    variant === "outline" &&
      "bg-transparent text-ui-fg-base border border-ui-border-base hover:bg-ui-bg-base-hover",
    variant === "transparent" &&
      "bg-transparent hover:bg-ui-bg-base-hover text-ui-fg-base",
    variant === "ghost" &&
      "bg-transparent text-ui-fg-base border border-transparent hover:border-ui-border-base hover:bg-ui-bg-base-hover",
    variant === "link" &&
      "bg-transparent text-brand-primary underline-offset-2 hover:underline hover:text-brand-hover px-0",
    variant === "danger" &&
      "bg-ui-button-danger text-ui-fg-on-color hover:bg-ui-button-danger-hover",
    variant === "dark" &&
      "bg-black text-white border border-white/10 hover:bg-neutral-900",
    variant === "icon" &&
      "bg-transparent text-ui-fg-base hover:bg-ui-bg-base-hover px-2",
    normalizedSize === "xs" && "h-7 px-3 text-xs",
    normalizedSize === "sm" && "h-9 px-4 text-sm",
    normalizedSize === "md" && "h-11 px-5 text-sm",
    normalizedSize === "lg" && "h-12 px-6 text-sm",
    className,
  )
}

export type ButtonSize = "xs" | "sm" | "md" | "lg"

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "transparent"
  | "ghost"
  | "link"
  | "danger"
  | "dark"
  | "icon"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize | "small" | "medium" | "large"
  isLoading?: boolean
  loadingText?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "medium",
      isLoading,
      loadingText = "Loading...",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonClassName({ variant, size, className })}
        {...props}
      >
        {isLoading ? loadingText : children}
      </button>
    )
  },
)

Button.displayName = "Button"
