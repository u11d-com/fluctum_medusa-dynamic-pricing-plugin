"use client"

import {
  addToCart as addToCartAction,
  deleteLineItem as deleteLineItemAction,
  updateLineItem as updateLineItemAction,
} from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { createContext, ReactNode, useContext, useState } from "react"
import { toast } from "sonner"

type StoreCart = HttpTypes.StoreCart

type CartContextValue = {
  cart: StoreCart | null
  addToCart: (input: {
    variantId: string
    quantity: number
    countryCode: string
  }) => Promise<void>
  updateLineItem: (input: {
    lineId: string
    quantity: number
  }) => Promise<void>
  deleteLineItem: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: StoreCart | null
  children: ReactNode
}) {
  const [cart, setCart] = useState<StoreCart | null>(initialCart)

  const addToCart: CartContextValue["addToCart"] = async (input) => {
    const updated = await addToCartAction(input)
    if (updated) setCart(updated)
    toast.success("Added to cart")
  }

  const updateLineItem: CartContextValue["updateLineItem"] = async (input) => {
    const updated = await updateLineItemAction(input)
    if (updated) setCart(updated)
    toast.success("Cart updated")
  }

  const deleteLineItem: CartContextValue["deleteLineItem"] = async (lineId) => {
    const updated = await deleteLineItemAction(lineId)
    if (updated) setCart(updated)
    toast.success("Item removed from cart")
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, updateLineItem, deleteLineItem }}>
      {children}
    </CartContext.Provider>
  )
}

const noopCart: CartContextValue = {
  cart: null,
  addToCart: async () => {},
  updateLineItem: async () => {},
  deleteLineItem: async () => {},
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  // Outside CartProvider (e.g. checkout preview rendered in (checkout) route group):
  // return a no-op context so components that only read prices or render in
  // preview mode (no mutations) don't crash.
  return value ?? noopCart
}
