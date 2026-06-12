import clsx from "clsx"
import { HTMLAttributes, forwardRef } from "react"

type StatusNoticeProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "success" | "warning" | "error"
}

export const StatusNotice = forwardRef<HTMLDivElement, StatusNoticeProps>(
  ({ className, tone = "info", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-lg border p-3",
          tone === "info" && "bg-ui-bg-subtle border-ui-border-base text-ui-fg-base",
          tone === "success" && "bg-tag-green-bg border-tag-green-border text-tag-green-text",
          tone === "warning" && "bg-tag-orange-bg border-tag-orange-border text-tag-orange-text",
          tone === "error" && "bg-tag-red-bg border-tag-red-border text-tag-red-text",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

StatusNotice.displayName = "StatusNotice"
