"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { useTranslations } from "next-intl"

export type SortOptions = "price_asc" | "price_desc" | "created_at" | "category"

function isSortOption(value: string): value is SortOptions {
  return value === "price_asc" || value === "price_desc" || value === "created_at" || value === "category"
}

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const t = useTranslations('store')
  const sortOptions = [
    { value: "category", label: t('sortDefault') },
    { value: "created_at", label: t('sortNewest') },
    { value: "price_asc", label: t('sortLowestPrice') },
    { value: "price_desc", label: t('sortHighestPrice') },
  ]

  const handleChange = (value: string) => {
    if (!isSortOption(value)) {
      return
    }

    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title={t('sortBy')}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
