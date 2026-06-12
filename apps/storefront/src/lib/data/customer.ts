"use server"

import { sdk } from "@lib/config"
import { getFormString, getOptionalFormString } from "@lib/util/form-data"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag, "max")

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = getFormString(formData, "password")
  const customerForm = {
    email: getFormString(formData, "email"),
    first_name: getFormString(formData, "first_name"),
    last_name: getFormString(formData, "last_name"),
    phone: getFormString(formData, "phone"),
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    if (typeof token !== "string") {
      throw new Error("Invalid auth token")
    }

    await setAuthToken(token)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    if (typeof loginToken !== "string") {
      throw new Error("Invalid login token")
    }

    await setAuthToken(loginToken)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag, "max")

    await transferCart()

    return createdCustomer
  } catch (error) {
    return String(error)
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = getFormString(formData, "email")
  const password = getFormString(formData, "password")

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        if (typeof token !== "string") {
          throw new Error("Invalid auth token")
        }

        await setAuthToken(token)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag, "max")
      })
  } catch (error) {
    return String(error)
  }

  try {
    await transferCart()
  } catch (error) {
    return String(error)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag, "max")

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const isDefaultBilling = currentState.isDefaultBilling === true
  const isDefaultShipping = currentState.isDefaultShipping === true

  const address = {
    first_name: getFormString(formData, "first_name"),
    last_name: getFormString(formData, "last_name"),
    company: getFormString(formData, "company"),
    address_1: getFormString(formData, "address_1"),
    address_2: getFormString(formData, "address_2"),
    city: getFormString(formData, "city"),
    postal_code: getFormString(formData, "postal_code"),
    province: getFormString(formData, "province"),
    country_code: getFormString(formData, "country_code"),
    phone: getFormString(formData, "phone"),
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const currentAddressId =
    typeof currentState.addressId === "string" ? currentState.addressId : ""
  const addressId = currentAddressId || getFormString(formData, "addressId")

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address: HttpTypes.StoreUpdateCustomerAddress = {
    first_name: getFormString(formData, "first_name"),
    last_name: getFormString(formData, "last_name"),
    company: getFormString(formData, "company"),
    address_1: getFormString(formData, "address_1"),
    address_2: getFormString(formData, "address_2"),
    city: getFormString(formData, "city"),
    postal_code: getFormString(formData, "postal_code"),
    province: getFormString(formData, "province"),
    country_code: getFormString(formData, "country_code"),
  }

  const phone = getOptionalFormString(formData, "phone")

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
