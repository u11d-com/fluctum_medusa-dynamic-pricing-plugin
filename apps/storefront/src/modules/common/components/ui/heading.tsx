import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3"
  variant?: "page" | "section" | "card" | "hero" | "checkout"
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    { className, level: Component = "h2", variant, children, ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          "font-semibold text-balance",
          variant === "page" && "text-3xl leading-[1.2]",
          variant === "section" && "text-2xl leading-[1.25]",
          variant === "card" && "text-xl leading-[1.3]",
          variant === "hero" && "text-4xl leading-[1.1] font-light tracking-tight",
          variant === "checkout" && "text-[2rem] leading-[2.75rem]",
          !variant && Component === "h1" && "text-3xl",
          !variant && Component === "h2" && "text-2xl",
          !variant && Component === "h3" && "text-xl",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Heading.displayName = "Heading"
