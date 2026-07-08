"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useTranslations } from "next-intl"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import SortProducts, { SortOptions } from "./sort-products"

type CategoryItem = {
  id: string
  name: string
  handle: string
}

type RefinementListProps = {
  sortBy: SortOptions
  categories?: CategoryItem[]
  selectedCat?: string
  search?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  categories = [],
  selectedCat,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('store')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  const setCatParam = (handle: string) => {
    const params = new URLSearchParams(searchParams)
    if (handle === "all") {
      params.delete("cat")
    } else {
      params.set("cat", handle)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const catItems = [
    { value: "all", label: t('allCategories') },
    ...categories.map((c) => ({ value: c.handle, label: c.name })),
  ]

  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
      {categories.length > 0 && (
        <FilterRadioGroup
          title={t('category')}
          items={catItems}
          value={selectedCat ?? "all"}
          handleChange={setCatParam}
        />
      )}
    </div>
  )
}

export default RefinementList
