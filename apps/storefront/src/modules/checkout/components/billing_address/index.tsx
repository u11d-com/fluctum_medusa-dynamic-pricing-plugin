import { HttpTypes } from "@medusajs/types"
import AddressFields, { createAddressFormData } from "../address-fields"
import React, { useState } from "react"

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    ...createAddressFormData("billing_address", cart?.billing_address),
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <AddressFields
        prefix="billing_address"
        formData={formData}
        onChange={handleChange}
        region={cart?.region}
        testIdFor={(key) => {
          if (key === "address_1") {
            return "billing-address-input"
          }

          if (key === "postal_code") {
            return "billing-postal-input"
          }

          if (key === "country_code") {
            return "billing-country-select"
          }

          return `billing-${key.replace("_", "-")}-input`
        }}
        requiredCity={false}
      />
    </>
  )
}

export default BillingAddress
