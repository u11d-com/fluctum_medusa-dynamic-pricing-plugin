import { test, expect, Page } from "@playwright/test"

const CURRENCY_PATTERN = /^\$[\d,]+\.\d{2}$/

function expectCurrencyFormat(text: string | null) {
  expect(text).not.toBeNull()
  expect(text).not.toBe("—")
  expect(text).toMatch(CURRENCY_PATTERN)
}

async function getDataValue(element: ReturnType<Page["getByTestId"]>) {
  const value = await element.getAttribute("data-value")
  return value ? parseFloat(value) : null
}

async function pickVariant(page: Page, label: string) {
  const options = page.locator('[data-testid="option-button"]')
  const count = await options.count()
  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent()
    if (text?.trim() === label) {
      await options.nth(i).click()
      return
    }
  }
  throw new Error(`Option "${label}" not found among ${count} buttons`)
}

test.describe("Cart reactivity", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cart cookie to start fresh
    await context.addCookies([
      {
        name: "_medusa_cart_id",
        value: "",
        domain: "localhost",
        path: "/",
        expires: -1,
      },
    ])
  })

  test("add to cart updates header badge without page refresh", async ({ page }) => {
    await page.goto("/products/american-gold-eagle-1-oz")
    await expect(page.getByRole("heading", { name: "American Gold Eagle 1 oz" })).toBeVisible()

    // Verify cart is empty initially
    const cartLink = page.getByTestId("nav-cart-link")
    await expect(cartLink).toContainText("Cart (0)")

    // Add first variant to cart
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()

    // Badge should update to 1 WITHOUT navigating away
    await expect(cartLink).toContainText("Cart (1)", { timeout: 5000 })

    // Wait for any pending router.refresh() to complete before clicking again
    // The add-to-cart button goes through states: "Add to cart" -> "Adding..." -> "Add to cart"
    const addBtn = page.getByTestId("add-product-button")
    await expect(addBtn).toHaveText("Add to cart", { timeout: 5000 })
    
    // Add same variant again - should increase quantity to 2
    await addBtn.click()
    // Wait for "Added to cart" toast or button to finish loading
    await expect(addBtn).toHaveText("Add to cart", { timeout: 10000 })
    
    // Go to cart page to verify the quantity is actually 2
    await page.goto("/cart")
    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toHaveValue("2", { timeout: 5000 })
  })

  test("add to cart from landing page updates header badge without refresh", async ({ page }) => {
    await page.goto("/")

    const cartLink = page.getByTestId("nav-cart-link")
    await expect(cartLink).toContainText("Cart (0)")

    const addBtn = page.getByTestId("add-to-cart-button").first()
    await addBtn.click()

    // Badge should update without navigation
    await expect(cartLink).toContainText("Cart (1)", { timeout: 5000 })
  })

  test("quantity change updates item quantity without page refresh", async ({ page }) => {
    // Setup: add item to cart
    await page.goto("/products/american-gold-eagle-1-oz")
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    // Go to cart page
    await page.goto("/cart")
    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toBeVisible()
    await expect(quantityInput).toHaveValue("1")

    // Change quantity from 1 to 2
    await quantityInput.fill("2")
    await quantityInput.blur()

    // Wait for update to complete (input re-enabled means transition finished)
    await expect(quantityInput).not.toBeDisabled({ timeout: 10000 })

    // Input should reflect the updated quantity without page refresh
    await expect(quantityInput).toHaveValue("2")
  })

  test("increment/decrement buttons update quantity without page refresh", async ({ page }) => {
    // Setup: add item to cart
    await page.goto("/products/american-gold-eagle-1-oz")
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")
    await page.goto("/cart")

    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toHaveValue("1")

    // Click increment — quantity should update without page refresh
    const incBtn = page.getByTestId("product-increment-button").first()
    await incBtn.click()
    await expect(quantityInput).not.toBeDisabled({ timeout: 10000 })
    await expect(quantityInput).toHaveValue("2")

    // Click decrement — quantity should go back to 1
    const decBtn = page.getByTestId("product-decrement-button").first()
    await decBtn.click()
    await expect(quantityInput).not.toBeDisabled({ timeout: 10000 })
    await expect(quantityInput).toHaveValue("1")
  })

  test("remove item updates cart without page refresh", async ({ page }) => {
    // Setup: add item to cart
    await page.goto("/products/american-gold-eagle-1-oz")
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    // Go to cart page
    await page.goto("/cart")
    await expect(page.getByTestId("product-row").first()).toBeVisible()

    // Verify item exists
    const itemRows = page.getByTestId("product-row")
    await expect(itemRows).toHaveCount(1)

    // Capture header cart count
    const cartLink = page.getByTestId("nav-cart-link")
    await expect(cartLink).toContainText("Cart (1)")

    // Click delete button
    const deleteBtn = page.getByTestId("product-delete-button").first()
    await deleteBtn.click()

    // Item should disappear without page refresh
    await expect(itemRows).toHaveCount(0, { timeout: 10000 })

    // Header badge should update to 0
    await expect(cartLink).toContainText("Cart (0)", { timeout: 5000 })

    // Cart should show empty state
    await expect(page.getByTestId("empty-cart-message")).toBeVisible({ timeout: 5000 })
  })

  test("remove one of multiple items updates correctly", async ({ page }) => {
    // Add first product
    await page.goto("/products/american-gold-eagle-1-oz")
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    // Add second product (different variant)
    await pickVariant(page, "2025")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (2)")

    // Go to cart
    await page.goto("/cart")
    const itemRows = page.getByTestId("product-row")
    await expect(itemRows).toHaveCount(2)

    // Remove first item
    const deleteBtn = page.getByTestId("product-delete-button").first()
    await deleteBtn.click()

    // Should have 1 item remaining without page refresh
    await expect(itemRows).toHaveCount(1, { timeout: 10000 })

    // Header badge should update to 1
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)", { timeout: 5000 })
  })
})
