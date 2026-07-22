import clsx from "clsx"
import { InputHTMLAttributes, forwardRef } from "react"
import { Label } from "./label"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className={clsx(
            "h-4 w-4 rounded border-ui-border-base text-brand-primary focus:ring-brand-primary bg-ui-bg-field",
            className,
          )}
          {...props}
        />
        {label && (
          <span>
            <Label htmlFor={id}>{label}</Label>
          </span>
        )}
      </div>
    )
  },
)

Checkbox.displayName = "Checkbox"
