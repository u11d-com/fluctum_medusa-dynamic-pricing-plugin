import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type ContainerProps = HTMLAttributes<HTMLDivElement>

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("bg-ui-bg-base rounded-lg p-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = "Container"
