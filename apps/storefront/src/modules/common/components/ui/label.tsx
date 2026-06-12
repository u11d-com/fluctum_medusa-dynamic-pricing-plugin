import clsx from "clsx"
import { LabelHTMLAttributes, forwardRef } from "react"

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx("text-sm font-medium text-ui-fg-base", className)}
        {...props}
      >
        {children}
      </label>
    )
  }
)

Label.displayName = "Label"
