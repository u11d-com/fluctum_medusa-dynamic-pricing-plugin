"use client"

import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@modules/common/components/ui"
import { useTranslations } from "next-intl"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
  className?: string
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
  className,
}: LineItemOptionsProps) => {
  const t = useTranslations('common')
  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className={clx(
        "inline-block text-xs text-ui-fg-subtle w-full overflow-hidden text-ellipsis",
        className
      )}
    >
      {t('variant', { title: variant?.title ?? '' })}
    </Text>
  )
}

export default LineItemOptions
