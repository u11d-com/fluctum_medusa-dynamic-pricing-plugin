import clsx from "clsx"
import { InputHTMLAttributes, forwardRef } from "react"
import { Label } from "./label"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <Label>{label}</Label>}
        <input
          ref={ref}
          className={clsx(
            "flex h-10 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus-visible:outline-none focus:shadow-borders-interactive-with-active disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = "Input"
