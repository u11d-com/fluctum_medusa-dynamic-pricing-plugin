import clsx from "clsx"
import { InputHTMLAttributes, forwardRef } from "react"
import { Label } from "./label"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  topLabel?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, topLabel, type, required, id, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <div className="flex flex-col w-full">
        {topLabel && <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            placeholder=" "
            className={clsx(
              "pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus-visible:outline-none focus-visible:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle"
            >
              {label}
              {required && <span className="text-rose-500">*</span>}
            </label>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"
