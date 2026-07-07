import { HttpTypes } from "@medusajs/types"
import { Checkbox, Container, Input, Text } from "@modules/common/components/ui"
import React, { useEffect, useMemo, useState } from "react"
import AddressFields, {
  createAddressFormData,
  toAddressFromFormData,
} from "../address-fields"
import AddressSelect, { AddressFields as StoreAddressFields } from "../address-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    ...createAddressFormData("shipping_address", cart?.shipping_address),
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: StoreAddressFields,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        ...createAddressFormData("shipping_address", address),
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

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
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <Text className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </Text>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={toAddressFromFormData("shipping_address", formData)}
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <AddressFields
        prefix="shipping_address"
        formData={formData}
        onChange={handleChange}
        region={cart?.region}
        testIdFor={(key) => {
          if (key === "address_1") {
            return "shipping-address-input"
          }

          if (key === "country_code") {
            return "shipping-country-select"
          }

          return `shipping-${key.replace("_", "-")}-input`
        }}
        includePhone={false}
      />
      <div className="my-8 flex justify-center">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
          className="accent-brand-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
