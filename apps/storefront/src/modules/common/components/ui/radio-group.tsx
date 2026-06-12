import clsx from "clsx"
import { HTMLAttributes, InputHTMLAttributes, forwardRef } from "react"
import { Label } from "./label"

type RadioGroupProps = HTMLAttributes<HTMLDivElement>

const RadioGroupRoot = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

RadioGroupRoot.displayName = "RadioGroup"

type RadioGroupItemProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          id={id}
          className={clsx(
            "h-4 w-4 border-ui-border-base text-brand-primary focus:ring-brand-primary bg-ui-bg-field",
            className
          )}
          {...props}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
      </div>
    )
  }
)

RadioGroupItem.displayName = "RadioGroupItem"

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
})
