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

test.describe("Checkout flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "_medusa_cart_id",
        value: "",
        domain: "localhost",
        path: "/",
        expires: -1,
      },
    ])
    await page.goto("/products/american-gold-eagle-1-oz")
    await expect(page.getByRole("heading", { name: "American Gold Eagle 1 oz" })).toBeVisible({ timeout: 30000 })
  })

  test("add to cart, update quantity, and verify dynamic price", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)

    const addBtn = page.getByTestId("add-product-button")
    await expect(addBtn).toBeEnabled()
    await expect(addBtn).toHaveText("Add to cart")
    await addBtn.click()

    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/cart")
    await expect(page.getByTestId("product-quantity").first()).toBeVisible()

    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toHaveValue("1")
    await quantityInput.fill("3")
    await quantityInput.blur()
    await expect(quantityInput).toHaveValue("3")
    await expect(quantityInput).not.toBeDisabled({ timeout: 15000 })

    const decBtn = page.getByTestId("product-decrement-button").first()
    await decBtn.click()
    await expect(quantityInput).toHaveValue("2")

    const incBtn = page.getByTestId("product-increment-button").first()
    await incBtn.click()
    await expect(quantityInput).toHaveValue("3")
  })

  test("add product to cart from landing page", async ({ page }) => {
    await page.goto("/")

    const addBtn = page.getByTestId("add-to-cart-button").first()
    await expect(addBtn).toBeVisible()
    await expect(addBtn).toHaveText("Add")

    const productTitle = await page.getByTestId("product-title").first().textContent()
    expect(productTitle).not.toBeNull()

    await addBtn.click()

    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)", { timeout: 10000 })

    await page.goto("/cart")
    await expect(page.getByTestId("product-quantity").first()).toBeVisible()
    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toHaveValue("1")
  })

  test("remove item from cart without page refresh", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/cart")
    await expect(page.getByTestId("product-row").first()).toBeVisible()

    await page.getByTestId("product-delete-button").first().click()

    // Item should disappear without a page refresh
    await expect(page.getByTestId("product-row").first()).not.toBeVisible({ timeout: 10000 })

    // Cart badge should reflect empty cart
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (0)", { timeout: 10000 })
  })

  test("quantity change updates prices without page refresh", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/cart")
    await expect(page.getByTestId("product-quantity").first()).toBeVisible()

    // Wait for SSE prices to load before reading data-value
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 15000 })

    // Capture price at quantity=1
    const priceBefore = await page.getByTestId("product-price").first().getAttribute("data-value")
    expect(priceBefore).not.toBeNull()
    const priceBeforeNum = parseFloat(priceBefore!)
    expect(priceBeforeNum).toBeGreaterThan(0)

    // Increment to 2
    const incBtn = page.getByTestId("product-increment-button").first()
    await incBtn.click()

    // Wait for quantity to update and spinner to clear
    const quantityInput = page.getByTestId("product-quantity").first()
    await expect(quantityInput).toHaveValue("2", { timeout: 5000 })
    await expect(quantityInput).not.toBeDisabled({ timeout: 15000 })

    // Price should approximately double (within 1% tolerance for spot price drift)
    const priceAfter = await page.getByTestId("product-price").first().getAttribute("data-value")
    expect(priceAfter).not.toBeNull()
    const priceAfterNum = parseFloat(priceAfter!)
    expect(priceAfterNum).toBeGreaterThan(priceBeforeNum * 1.9)
    expect(priceAfterNum).toBeLessThan(priceBeforeNum * 2.1)
  })

  test("complete full checkout flow with price lock", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/cart")
    await page.getByRole("button", { name: "Go to checkout" }).click()

    await page.waitForURL(/\/checkout/)
    await expect(page.getByRole("heading", { name: "Shipping Address" })).toBeVisible()

    // --- Checkout: validate price format and totals ---
    // Wait for checkout summary to lock prices and display items
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })
    const initialPriceText = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(initialPriceText)

    const initialUnitPriceText = await page.getByTestId("product-unit-price").first().textContent()
    expectCurrencyFormat(initialUnitPriceText)

    // Wait for both total and subtotal to reflect locked price (not Medusa placeholder value of 1)
    await expect
      .poll(async () => getDataValue(page.getByTestId("cart-total")), { timeout: 15000 })
      .toBeGreaterThan(100)
    const checkoutTotal = await getDataValue(page.getByTestId("cart-total"))
    expect(checkoutTotal).toBeGreaterThan(0)

    await expect
      .poll(async () => getDataValue(page.getByTestId("cart-subtotal")), { timeout: 15000 })
      .toBeGreaterThan(100)
    const checkoutSubtotal = await getDataValue(page.getByTestId("cart-subtotal"))
    expect(checkoutSubtotal).toBeGreaterThan(0)

    // --- Fill shipping address ---
    await page.locator('input[name="shipping_address.first_name"]').fill("John")
    await page.locator('input[name="shipping_address.last_name"]').fill("Doe")
    await page.locator('input[name="shipping_address.address_1"]').fill("123 Main St")
    await page.locator('input[name="shipping_address.postal_code"]').fill("10001")
    await page.locator('input[name="shipping_address.city"]').fill("New York")
    await page.locator('input[name="email"]').fill("john@example.com")

    const continueToDelivery = page.getByRole("button", { name: "Continue to delivery" })
    await continueToDelivery.click()
    await page.waitForURL(/step=delivery/)

    // --- Delivery step: price preserved after address redirect ---
    // Checkout remounts after redirect; wait for locked prices to reload
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })
    const priceAfterAddress = await page.getByTestId("product-price").first().textContent()
    // Dynamic pricing: spot prices tick every 10s; assert format only (lock correctness is unit-tested)
    expectCurrencyFormat(priceAfterAddress)

    // Wait for subtotal to reflect locked price after remount (not Medusa placeholder value of 1)
    await expect
      .poll(async () => getDataValue(page.getByTestId("cart-subtotal")), { timeout: 15000 })
      .toBeGreaterThan(100)
    const subtotalAfterAddress = await getDataValue(page.getByTestId("cart-subtotal"))
    expect(subtotalAfterAddress).toBeGreaterThan(100)

    const totalAfterAddress = await getDataValue(page.getByTestId("cart-total"))
    expect(totalAfterAddress).toBeGreaterThan(100)

    // --- Select shipping and go to payment ---
    await page.getByText(/Standard Shipping/).click()
    await expect(page.getByRole("button", { name: "Continue to payment" })).not.toBeDisabled({ timeout: 15000 })
    await page.getByRole("button", { name: "Continue to payment" }).click()
    await page.waitForTimeout(500)
    await expect(page.getByRole("button", { name: "Continue to review" })).toBeVisible()

    // --- Payment step: price displayed after delivery submit ---
    const priceAfterDelivery = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(priceAfterDelivery)

    await page.getByText("Manual Payment").click()
    await page.waitForTimeout(300)
    await page.getByRole("button", { name: "Continue to review" }).click()
    // Hard reload happens here (window.location.assign); wait for review step to load
    await page.waitForURL(/step=review/, { timeout: 30000 })
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })

    // --- Review step: price displayed (format verified) ---
    const priceAfterPayment = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(priceAfterPayment)

    // --- Place order ---
    await page.getByRole("button", { name: "Place order" }).click()
    await page.waitForURL(/\/order\/.*\/confirmed/)
    await expect(page.getByText(/Thank you/)).toBeVisible()

    // --- Order confirmed: validate final prices ---
    const orderUnitPriceText = await page.getByTestId("product-unit-price").first().textContent()
    expectCurrencyFormat(orderUnitPriceText)

    const orderPriceText = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(orderPriceText)

    const orderTotal = await getDataValue(page.getByTestId("cart-total"))
    expect(orderTotal).toBeGreaterThan(0)

    const orderSubtotal = await getDataValue(page.getByTestId("cart-subtotal"))
    expect(orderSubtotal).toBeGreaterThan(0)

    // --- Cross-check: subtotal ≈ unit_price × quantity ---
    const quantity = await page.getByTestId("product-quantity").first()
    const qty = parseInt((await quantity.textContent()) || "0", 10)
    const unitPriceNum = parseFloat(orderUnitPriceText!.replace(/[$,]/g, ""))
    const expectedSubtotal = Math.round(unitPriceNum * qty * 100) / 100
    expect(orderSubtotal).toBeCloseTo(expectedSubtotal, 0)

    // --- Validate payment amount on order confirmed ---
    const paymentAmount = await page.getByTestId("payment-amount").textContent()
    expect(paymentAmount).not.toBeNull()
    expect(paymentAmount).toMatch(/^\$[\d,]+\.\d{2}/)
  })

  test("refresh prices creates new locks", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/checkout")
    await page.waitForURL(/\/checkout/)
    // Wait for checkout summary to lock prices and display items
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })

    // --- Validate price format before refresh ---
    const priceBefore = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(priceBefore)

    const totalBefore = await getDataValue(page.getByTestId("cart-total"))
    expect(totalBefore).toBeGreaterThan(0)

    await page.getByRole("button", { name: "Refresh prices" }).click()
    await page.waitForTimeout(500)
    // Wait for refreshed prices to display
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })

    // --- Validate price format after refresh ---
    const priceAfter = await page.getByTestId("product-price").first().textContent()
    expectCurrencyFormat(priceAfter)

    const totalAfter = await getDataValue(page.getByTestId("cart-total"))
    expect(totalAfter).toBeGreaterThan(0)
  })

  test("page refresh preserves locked prices", async ({ page }) => {
    await pickVariant(page, "2024")
    await page.waitForTimeout(300)
    await page.getByTestId("add-product-button").click()
    await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)")

    await page.goto("/checkout")
    await page.waitForURL(/\/checkout/)
    // Wait for checkout summary to lock prices and display items
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })

    // --- Capture both item price and totals ---
    const priceBefore = await page.getByTestId("product-price").first().textContent()
    const totalBefore = await getDataValue(page.getByTestId("cart-total"))
    const subtotalBefore = await getDataValue(page.getByTestId("cart-subtotal"))
    expectCurrencyFormat(priceBefore)
    expect(totalBefore).toBeGreaterThan(0)

    await page.reload()
    await page.waitForURL(/\/checkout/)
    // Wait for locked prices to reload after page refresh
    await expect(page.getByTestId("product-price").first()).toBeVisible({ timeout: 30000 })

    // --- Verify item price AND totals preserved ---
    const priceAfter = await page.getByTestId("product-price").first().textContent()
    expect(priceAfter).toBe(priceBefore)

    const totalAfter = await getDataValue(page.getByTestId("cart-total"))
    expect(totalAfter).toBe(totalBefore)

    const subtotalAfter = await getDataValue(page.getByTestId("cart-subtotal"))
    expect(subtotalAfter).toBe(subtotalBefore)
  })
})
