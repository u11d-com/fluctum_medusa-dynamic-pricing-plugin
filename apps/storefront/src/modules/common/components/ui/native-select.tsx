import { ChevronUpDown } from "@medusajs/icons"
import clsx from "clsx"
import { SelectHTMLAttributes, forwardRef } from "react"

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder = "Select...", defaultValue, value, className, children, ...props }, ref) => {
    const currentValue = value ?? defaultValue
    const isPlaceholder = currentValue === "" || currentValue === undefined

    return (
      <div
        className={clsx(
          "relative flex items-center text-base-regular border border-ui-border-base bg-ui-bg-subtle rounded-md hover:bg-ui-bg-field-hover",
          isPlaceholder && "text-ui-fg-muted",
          className
        )}
      >
        <select
          ref={ref}
          defaultValue={defaultValue}
          value={value}
          className="appearance-none flex-1 bg-transparent border-none px-4 py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-0"
          {...props}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {children}
        </select>
        <span className="absolute right-4 inset-y-0 flex items-center pointer-events-none">
          <ChevronUpDown />
        </span>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"
