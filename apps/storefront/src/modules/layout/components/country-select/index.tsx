"use client"

import { useParams, usePathname } from "next/navigation"
import { useTransition } from "react"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { NativeSelect } from "@modules/common/components/ui"

type RegionOption = {
  label: string
  value: string       // representative iso_2 (first country of region)
  isoCodes: string[]  // all iso_2 codes in this region
}

function buildRegionOptions(regions: HttpTypes.StoreRegion[]): RegionOption[] {
  return regions.map((r) => ({
    label: r.name ?? r.currency_code?.toUpperCase() ?? "Unknown",
    value: r.countries?.[0]?.iso_2 ?? "",
    isoCodes: (r.countries ?? []).flatMap((c) => (c.iso_2 ? [c.iso_2] : [])),
  }))
}

export default function CountrySelect({
  regions,
}: {
  regions: HttpTypes.StoreRegion[]
}) {
  const params = useParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const countryCode =
    typeof params.countryCode === "string" ? params.countryCode : ""

  const options = buildRegionOptions(regions)

  // Find the option whose isoCodes list contains the current countryCode.
  // Fall back to the first option if no match.
  const selectedOption =
    options.find((o) => o.isoCodes.includes(countryCode)) ?? options[0]

  // Strip the leading /{countryCode} from the pathname so updateRegion can
  // prepend the new one: redirect(`/${newCode}${currentPath}`)
  const currentPath = countryCode
    ? pathname.replace(`/${countryCode}`, "")
    : pathname

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCountryCode = e.target.value
    startTransition(async () => {
      await updateRegion(newCountryCode, currentPath)
    })
  }

  return (
    <NativeSelect
      value={selectedOption?.value ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="!bg-transparent !border-white/20 !text-white/60 hover:!bg-white/5 text-xs min-w-[140px]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-black text-white">
          {o.label}
        </option>
      ))}
    </NativeSelect>
  )
}
