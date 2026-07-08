"use client"

import { useTranslations } from 'next-intl'
import { HttpTypes } from "@medusajs/types"
import { Input } from "@modules/common/components/ui"
import React from "react"
import CountrySelect from "../country-select"

export type AddressKey =
  | "first_name"
  | "last_name"
  | "address_1"
  | "company"
  | "postal_code"
  | "city"
  | "country_code"
  | "province"
  | "phone"

export type AddressPrefix = "shipping_address" | "billing_address"

const ADDRESS_KEYS: AddressKey[] = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
]

function fieldName(prefix: AddressPrefix, key: AddressKey): string {
  return `${prefix}.${key}`
}

type AddressLike = Pick<
  HttpTypes.StoreCartAddress,
  | "first_name"
  | "last_name"
  | "address_1"
  | "company"
  | "postal_code"
  | "city"
  | "country_code"
  | "province"
  | "phone"
>

export function createAddressFormData(
  prefix: AddressPrefix,
  address?: AddressLike | null
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key of ADDRESS_KEYS) {
    result[fieldName(prefix, key)] = address?.[key] || ""
  }

  return result
}

export function toAddressFromFormData(
  prefix: AddressPrefix,
  formData: Record<string, string>
): AddressLike {
  return {
    first_name: formData[fieldName(prefix, "first_name")] || "",
    last_name: formData[fieldName(prefix, "last_name")] || "",
    address_1: formData[fieldName(prefix, "address_1")] || "",
    company: formData[fieldName(prefix, "company")] || "",
    postal_code: formData[fieldName(prefix, "postal_code")] || "",
    city: formData[fieldName(prefix, "city")] || "",
    country_code: formData[fieldName(prefix, "country_code")] || "",
    province: formData[fieldName(prefix, "province")] || "",
    phone: formData[fieldName(prefix, "phone")] || "",
  }
}

type AddressFieldsProps = {
  prefix: AddressPrefix
  formData: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  region?: HttpTypes.StoreRegion
  testIdFor: (key: AddressKey) => string
  requiredCity?: boolean
  includePhone?: boolean
}

const AddressFields = ({
  prefix,
  formData,
  onChange,
  region,
  testIdFor,
  requiredCity = true,
  includePhone = true,
}: AddressFieldsProps) => {
  const t = useTranslations('checkout')

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input
        label={t('firstName')}
        name={fieldName(prefix, "first_name")}
        autoComplete="given-name"
        value={formData[fieldName(prefix, "first_name")]}
        onChange={onChange}
        required
        data-testid={testIdFor("first_name")}
      />
      <Input
        label={t('lastName')}
        name={fieldName(prefix, "last_name")}
        autoComplete="family-name"
        value={formData[fieldName(prefix, "last_name")]}
        onChange={onChange}
        required
        data-testid={testIdFor("last_name")}
      />
      <Input
        label={t('address')}
        name={fieldName(prefix, "address_1")}
        autoComplete="address-line1"
        value={formData[fieldName(prefix, "address_1")]}
        onChange={onChange}
        required
        data-testid={testIdFor("address_1")}
      />
      <Input
        label={t('company')}
        name={fieldName(prefix, "company")}
        value={formData[fieldName(prefix, "company")]}
        onChange={onChange}
        autoComplete="organization"
        data-testid={testIdFor("company")}
      />
      <Input
        label={t('postalCode')}
        name={fieldName(prefix, "postal_code")}
        autoComplete="postal-code"
        value={formData[fieldName(prefix, "postal_code")]}
        onChange={onChange}
        required
        data-testid={testIdFor("postal_code")}
      />
      <Input
        label={t('city')}
        name={fieldName(prefix, "city")}
        autoComplete="address-level2"
        value={formData[fieldName(prefix, "city")]}
        onChange={onChange}
        required={requiredCity}
        data-testid={testIdFor("city")}
      />
      <CountrySelect
        name={fieldName(prefix, "country_code")}
        autoComplete="country"
        region={region}
        value={formData[fieldName(prefix, "country_code")]}
        onChange={onChange}
        required
        data-testid={testIdFor("country_code")}
      />
      <Input
        label={t('state')}
        name={fieldName(prefix, "province")}
        autoComplete="address-level1"
        value={formData[fieldName(prefix, "province")]}
        onChange={onChange}
        data-testid={testIdFor("province")}
      />
      {includePhone && (
        <Input
          label={t('phone')}
          name={fieldName(prefix, "phone")}
          autoComplete="tel"
          value={formData[fieldName(prefix, "phone")]}
          onChange={onChange}
          data-testid={testIdFor("phone")}
        />
      )}
    </div>
  )
}

export default AddressFields
