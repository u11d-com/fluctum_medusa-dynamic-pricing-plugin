"use server"

import { sdk } from "@lib/config"
import { getCheckboxValue, getFormString } from "@lib/util/form-data"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import type { LockPricesResult } from "@u11d/medusa-dynamic-pricing/client"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "./locale-actions"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(
  cartId?: string,
  fields?: string,
  noCache?: boolean
) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = noCache ? undefined : { ...(await getCacheOptions("carts")) }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: noCache ? "no-store" : "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag, "max")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag, "max")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag, "max")

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}): Promise<HttpTypes.StoreCart | null> {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .catch(medusaError)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag, "max")

  return await retrieveCart(cart.id)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}): Promise<HttpTypes.StoreCart | null> {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .catch(medusaError)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag, "max")

  return await retrieveCart(cartId)
}

export async function deleteLineItem(
  lineId: string
): Promise<HttpTypes.StoreCart | null> {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .catch(medusaError)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag, "max")

  return await retrieveCart(cartId)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
      return resp
    })
    .catch(medusaError)
}

export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const shippingAddress = {
      first_name: getFormString(formData, "shipping_address.first_name"),
      last_name: getFormString(formData, "shipping_address.last_name"),
      address_1: getFormString(formData, "shipping_address.address_1"),
      address_2: "",
      company: getFormString(formData, "shipping_address.company"),
      postal_code: getFormString(formData, "shipping_address.postal_code"),
      city: getFormString(formData, "shipping_address.city"),
      country_code: getFormString(formData, "shipping_address.country_code"),
      province: getFormString(formData, "shipping_address.province"),
      phone: getFormString(formData, "shipping_address.phone"),
    }

    const data: HttpTypes.StoreUpdateCart = {
      shipping_address: shippingAddress,
      email: getFormString(formData, "email"),
    }

    const sameAsBilling = getCheckboxValue(formData, "same_as_billing")

    if (sameAsBilling) {
      data.billing_address = shippingAddress
    }

    if (!sameAsBilling) {
      data.billing_address = {
        first_name: getFormString(formData, "billing_address.first_name"),
        last_name: getFormString(formData, "billing_address.last_name"),
        address_1: getFormString(formData, "billing_address.address_1"),
        address_2: "",
        company: getFormString(formData, "billing_address.company"),
        postal_code: getFormString(formData, "billing_address.postal_code"),
        city: getFormString(formData, "billing_address.city"),
        country_code: getFormString(formData, "billing_address.country_code"),
        province: getFormString(formData, "billing_address.province"),
        phone: getFormString(formData, "billing_address.phone"),
      }
    }
    await updateCart(data)
  } catch (e: unknown) {
    if (e instanceof Error) {
      return e.message
    }

    return "Failed to set addresses"
  }

  const checkoutCountryCode = getFormString(formData, "shipping_address.country_code")
  redirect(`/${checkoutCountryCode}/checkout?step=delivery`)
}

/**
 * Locks (or reuses existing locks) for cart items.
 * When force=false (default): reuses existing valid locks if they exist for all items.
 * When force=true: deletes old locks and creates fresh ones.
 * Returns lock info including the expiry timestamp.
 */
export async function lockCartPrices(cartId: string, force = false): Promise<LockPricesResult> {
  const query = force ? { force: "true" } : undefined

  return sdk.client.fetch<LockPricesResult>(
    `/store/dynamic-pricing/carts/${cartId}/price-lock`,
    {
      method: "POST",
      query,
      cache: "no-store",
    }
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * Does NOT re-lock prices — prices are already locked on checkout entry
 * (via CheckoutSummary useEffect) and the validate hook checks lock validity
 * before completing the cart.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag, "max")

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await removeCartId()
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag, "max")

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag, "max")

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
