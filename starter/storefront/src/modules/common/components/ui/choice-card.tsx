import clsx from "clsx"
import { ButtonHTMLAttributes, HTMLAttributes, forwardRef } from "react"

export const choiceCardClassName = ({
  selected = false,
  disabled = false,
  className,
}: {
  selected?: boolean
  disabled?: boolean
  className?: string
}) =>
  clsx(
    "border border-ui-border-base bg-ui-bg-base rounded-rounded transition-all duration-150 mb-3",
    "hover:shadow-borders-interactive-with-active",
    selected && "border-ui-border-interactive",
    disabled && "opacity-60 pointer-events-none",
    className,
  )

type ChoiceCardProps = HTMLAttributes<HTMLDivElement> & {
  selected?: boolean
  disabled?: boolean
}

export const ChoiceCard = forwardRef<HTMLDivElement, ChoiceCardProps>(
  (
    { className, selected = false, disabled = false, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={choiceCardClassName({ selected, disabled, className })}
        {...props}
      >
        {children}
      </div>
    )
  },
)

ChoiceCard.displayName = "ChoiceCard"

type ChoiceCardButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

export const ChoiceCardButton = forwardRef<
  HTMLButtonElement,
  ChoiceCardButtonProps
>(
  (
    {
      className,
      selected = false,
      disabled = false,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={choiceCardClassName({ selected, disabled, className })}
        {...props}
      >
        {children}
      </button>
    )
  },
)

ChoiceCardButton.displayName = "ChoiceCardButton"
