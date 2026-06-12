import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3"
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    { className, level: Component = "h2", size, children, ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          "font-semibold text-balance",
          size === "sm" && "text-lg leading-[1.35]",
          size === "md" && "text-xl leading-[1.3]",
          size === "lg" && "text-2xl leading-[1.25]",
          size === "xl" && "text-3xl leading-[1.2]",
          size === "2xl" && "text-[2rem] leading-[2.75rem]",
          !size && Component === "h1" && "text-3xl leading-[1.2]",
          !size && Component === "h2" && "text-2xl leading-[1.25]",
          !size && Component === "h3" && "text-xl leading-[1.3]",
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
