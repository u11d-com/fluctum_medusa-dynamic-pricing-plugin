import { expect, test, type BrowserContext, type Page } from "@playwright/test"

const REGION_CASES = [
  {
    countryCode: "us",
    currencyPattern: /\$[\d,]+\.\d{2}/,
    productPricePattern: /\$[\d,]+\.\d{2}/,
  },
  {
    countryCode: "de",
    currencyPattern: /€[\d,.]+|[\d,.]+\s*€|EUR/i,
    productPricePattern: /€[\d,.]+|[\d,.]+\s*€|EUR/i,
  },
  {
    countryCode: "pl",
    currencyPattern: /PLN|zł/i,
    productPricePattern: /PLN\s*[\d,]+\.\d{2}|zł/i,
  },
] as const

async function clearCartCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: "_medusa_cart_id",
      value: "",
      domain: "localhost",
      path: "/",
      expires: -1,
    },
  ])
}

async function collectServerActionFailures(page: Page): Promise<string[]> {
  const failures: string[] = []

  page.on("response", async (response) => {
    if (response.status() < 500) {
      return
    }

    let body = ""
    try {
      body = (await response.text()).slice(0, 500)
    } catch (error) {
      if (error instanceof Error) {
        body = error.message
      } else {
        throw error
      }
    }

    failures.push(`${response.status()} ${response.url()} ${body}`)
  })

  return failures
}

async function expectNoRegionError(page: Page, failures: readonly string[]) {
  await expect(page.getByText("Error setting up the request")).not.toBeVisible()
  await expect(page.getByText("An unknown error occurred")).not.toBeVisible()
  await expect.poll(() => failures).toHaveLength(0)
}

async function addRecommendedProduct(page: Page) {
  const addButton = page.getByTestId("add-to-cart-button").last()
  await expect(addButton).toBeVisible()
  await addButton.click()
  await expect(page.getByTestId("nav-cart-link")).toContainText("Cart (1)", {
    timeout: 15_000,
  })
}

test.describe("Region switching", () => {
  test.beforeEach(async ({ context }) => {
    await clearCartCookie(context)
  })

  test("US region adds to cart and displays USD prices", async ({ page }) => {
    const failures = await collectServerActionFailures(page)

    await page.goto("/us")

    await expect(page.getByText(REGION_CASES[0].currencyPattern).first()).toBeVisible({
      timeout: 15_000,
    })

    await addRecommendedProduct(page)
    await page.goto("/us/cart")

    await expect(page.getByTestId("product-row").first()).toBeVisible()
    await expect(page.locator("body")).toContainText(REGION_CASES[0].productPricePattern, {
      timeout: 15_000,
    })
    await expectNoRegionError(page, failures)
  })

  test("Europe region displays EUR prices without errors", async ({ page }) => {
    const failures = await collectServerActionFailures(page)

    await page.goto("/de")

    await expect(page.getByText(REGION_CASES[1].currencyPattern).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.locator("body")).toContainText(REGION_CASES[1].productPricePattern, {
      timeout: 15_000,
    })
    await expectNoRegionError(page, failures)
  })

  test("Poland region adds to cart and displays numeric PLN prices without errors", async ({ page }) => {
    const failures = await collectServerActionFailures(page)

    await page.goto("/us")
    await addRecommendedProduct(page)

    await page.locator("select").selectOption("pl")
    await page.waitForURL(/\/pl$/)

    await expect(page.getByText(REGION_CASES[2].currencyPattern).first()).toBeVisible({
      timeout: 15_000,
    })

    await addRecommendedProduct(page)
    await page.goto("/pl/cart")

    await expect(page.getByTestId("product-row").first()).toBeVisible()
    await expect(page.locator("body")).toContainText(REGION_CASES[2].productPricePattern, {
      timeout: 15_000,
    })
    await expectNoRegionError(page, failures)
  })
})
