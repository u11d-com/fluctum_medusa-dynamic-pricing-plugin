# Architecture Deep Dive: Workflow Orchestration

Workflows are Medusa's orchestration layer - they coordinate steps, manage transactions, and provide automatic rollback. Understanding workflow orchestration is essential for building robust, reliable applications.

## What is Workflow Orchestration?

**Workflow orchestration** means coordinating multiple operations into a cohesive business process with automatic rollback capabilities.

```
Simple Operation (No Orchestration)
┌─────────────┐
│   Action    │ ← Single operation, no coordination
└─────────────┘

Orchestrated Workflow
┌─────────────────────────────────────────────────┐
│  Workflow (Orchestrator)                        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │  Step 1  │→→→│  Step 2  │→→→│  Step 3  │   │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   │
│       │              │              │          │
│       ▼              ▼              ▼          │
│  ┌────────┐     ┌────────┐     ┌────────┐     │
│  │Rollback│     │Rollback│     │Rollback│     │
│  │Step 1  │◀◀◀◀◀│Step 2  │◀◀◀◀◀│Step 3  │     │
│  └────────┘     └────────┘     └────────┘     │
└─────────────────────────────────────────────────┘
```

## Why Workflows Instead of Direct Service Calls?

### ❌ Problem: Direct Service Calls

```typescript
// Without workflows - Manual coordination and rollback
async function createBrandWithLogo(brandData, logoFile) {
  let brand
  let logoUrl

  try {
    // Step 1: Create brand
    const brandService = container.resolve("brand")
    brand = await brandService.createBrands([brandData])

    // Step 2: Upload logo
    const s3Service = container.resolve("s3Service")
    logoUrl = await s3Service.upload(logoFile)

    // Step 3: Update brand with logo URL
    await brandService.updateBrands([{
      id: brand.id,
      logo_url: logoUrl,
    }])

    return { brand, logoUrl }
  } catch (error) {
    // Manual rollback - Error-prone!
    if (brand) {
      try {
        await brandService.deleteBrands([brand.id])
      } catch (rollbackError) {
        // What if rollback fails? Data is now inconsistent!
        console.error("Rollback failed:", rollbackError)
      }
    }

    if (logoUrl) {
      try {
        await s3Service.delete(logoUrl)
      } catch (rollbackError) {
        // Orphaned file in S3!
        console.error("S3 cleanup failed:", rollbackError)
      }
    }

    throw error
  }
}
```

**Problems**:
1. ❌ Manual rollback logic - easy to make mistakes
2. ❌ No guaranteed cleanup - rollback can fail
3. ❌ Code duplication - same pattern repeated everywhere
4. ❌ Hard to test - must test success and all failure scenarios
5. ❌ Hard to extend - adding new steps requires updating rollback logic

### ✅ Solution: Workflow Orchestration

```typescript
// With workflows - Automatic coordination and rollback
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    if (!brandId) return
    const brandService = container.resolve("brand")
    await brandService.deleteBrands([brandId])
  }
)

const uploadLogoStep = createStep(
  "upload-logo",
  async (input, { container }) => {
    const s3Service = container.resolve("s3Service")
    const logoUrl = await s3Service.upload(input.logo)
    return new StepResponse(logoUrl, logoUrl)
  },
  async (logoUrl, { container }) => {
    if (!logoUrl) return
    const s3Service = container.resolve("s3Service")
    await s3Service.delete(logoUrl)
  }
)

const updateBrandLogoStep = createStep(
  "update-brand-logo",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    await brandService.updateBrands([{
      id: input.brandId,
      logo_url: input.logoUrl,
    }])
    return new StepResponse("updated", { brandId: input.brandId, previousLogoUrl: null })
  },
  async (compensationData, { container }) => {
    const brandService = container.resolve("brand")
    await brandService.updateBrands([{
      id: compensationData.brandId,
      logo_url: compensationData.previousLogoUrl,
    }])
  }
)

export const createBrandWithLogoWorkflow = createWorkflow(
  "create-brand-with-logo",
  function (input) {
    const brand = createBrandStep(input)
    const logoUrl = uploadLogoStep({ logo: input.logo })
    updateBrandLogoStep({
      brandId: brand.id,
      logoUrl: logoUrl,
    })

    return new WorkflowResponse({ brand, logoUrl })
  }
)

// Use it
const { result } = await createBrandWithLogoWorkflow(container)
  .run({ input: { name: "Nike", logo: file } })
```

**Benefits**:
1. ✅ Automatic rollback - Medusa handles compensation
2. ✅ Guaranteed cleanup - all or nothing
3. ✅ No code duplication - compensation defined once per step
4. ✅ Easy to test - test steps independently
5. ✅ Easy to extend - add new steps, compensation happens automatically

## Workflow Architecture

### Declarative vs. Imperative

**Key insight**: Workflows are DECLARATIVE, not IMPERATIVE.

```typescript
// ❌ WRONG - Imperative (trying to execute)
createWorkflow("wrong", async function (input) {
  const result = await someStep(input)  // ❌ Using await!
  return result
})

// ✅ CORRECT - Declarative (defining flow)
createWorkflow("correct", function (input) {
  const result = someStep(input)  // ✅ No await! Just defining flow
  return new WorkflowResponse(result)
})
```

**Why?**

Workflows define what happens, not how it happens:

```
Workflow Definition (What)      Workflow Execution (How)
┌────────────────────┐           ┌──────────────────────┐
│ function (input) { │           │  Engine executes:    │
│   step1(input)     │──────▶    │  1. Calls step1      │
│   step2(step1)     │           │  2. Waits for result │
│   step3(step2)     │           │  3. Calls step2      │
│   return response  │           │  4. Waits for result │
│ }                  │           │  5. Calls step3      │
└────────────────────┘           │  6. Returns response │
                                 └──────────────────────┘
```

You define the flow synchronously. The engine executes it asynchronously.

## Step Composition Patterns

### Pattern 1: Sequential Steps

Each step depends on the previous step's output:

```typescript
createWorkflow("sequential", function (input) {
  const brand = createBrandStep(input.brand)
  const product = createProductStep({
    title: input.productTitle,
    brand_id: brand.id,  // Uses output from previous step
  })
  const inventory = allocateInventoryStep({
    product_id: product.id,  // Uses output from previous step
    quantity: input.quantity,
  })

  return new WorkflowResponse({ brand, product, inventory })
})
```

**Execution order**: step1 → step2 → step3 (sequential)

**Rollback order** (if step3 fails): compensate(step2) → compensate(step1)

### Pattern 2: Conditional Steps

Use `when()` for conditional execution:

```typescript
import { createWorkflow, when } from "@medusajs/framework/workflows-sdk"

createWorkflow("conditional", function (input) {
  const brand = createBrandStep(input.brand)

  // Only send notification if brand is premium
  when({ brand }, ({ brand }) => {
    return brand.is_premium
  }).then(() => {
    sendPremiumNotificationStep(brand)
  })

  return new WorkflowResponse(brand)
})
```

### Pattern 3: Transform Data

Use `transform()` to shape data between steps:

```typescript
import { createWorkflow, transform } from "@medusajs/framework/workflows-sdk"

createWorkflow("transform-example", function (input) {
  const brands = createMultipleBrandsStep(input.brands)

  // Transform array of brands to just their IDs
  const brandIds = transform({ brands }, ({ brands }) => {
    return brands.map(b => b.id)
  })

  const products = createProductsStep({
    products: input.products,
    brand_ids: brandIds,  // Use transformed data
  })

  return new WorkflowResponse({ brands, products })
})
```

## Compensation Function Patterns

### Pattern 1: Simple Delete

Most common pattern - delete what was created:

```typescript
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    if (!brandId) return
    const brandService = container.resolve("brand")
    await brandService.deleteBrands([brandId])
  }
)
```

### Pattern 2: Restore Previous State

For updates, restore the previous value:

```typescript
const updateBrandStep = createStep(
  "update-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")

    // Get current brand to save its state
    const [currentBrand] = await brandService.retrieveBrands([input.id])

    // Update brand
    const [updatedBrand] = await brandService.updateBrands([{
      id: input.id,
      name: input.name,
    }])

    // Return updated brand as result, current brand for compensation
    return new StepResponse(updatedBrand, {
      id: currentBrand.id,
      previousName: currentBrand.name,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const brandService = container.resolve("brand")

    // Restore previous name
    await brandService.updateBrands([{
      id: compensationData.id,
      name: compensationData.previousName,
    }])
  }
)
```

### Pattern 3: No Compensation Needed

Read-only operations don't need compensation:

```typescript
const getBrandStep = createStep(
  "get-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.retrieveBrands([input.id])
    return new StepResponse(brand)
  }
  // No compensation function - read-only operation
)
```

### Pattern 4: External Service Compensation

Clean up external resources:

```typescript
const uploadToS3Step = createStep(
  "upload-to-s3",
  async (input, { container }) => {
    const s3Service = container.resolve("s3Service")
    const result = await s3Service.upload(input.file)

    return new StepResponse(result.url, {
      url: result.url,
      bucket: result.bucket,
      key: result.key,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const s3Service = container.resolve("s3Service")

    // Delete file from S3
    await s3Service.deleteObject({
      bucket: compensationData.bucket,
      key: compensationData.key,
    })
  }
)
```

## Real-World Example: Complex Order Workflow

Here's a real-world scenario showing workflow orchestration:

```typescript
export const createOrderWorkflow = createWorkflow(
  "create-order",
  function (input) {
    // Step 1: Validate inventory (read-only, no compensation)
    const inventoryCheck = validateInventoryStep(input.items)

    // Step 2: Create order
    const order = createOrderStep({
      customer_id: input.customer_id,
      items: input.items,
    })

    // Step 3: Reserve inventory (parallel with payment)
    const reservation = reserveInventoryStep({
      order_id: order.id,
      items: input.items,
    })

    // Step 4: Process payment (parallel with inventory)
    const payment = processPaymentStep({
      order_id: order.id,
      amount: input.amount,
      payment_method: input.payment_method,
    })

    // Step 5: Send confirmation (only after payment succeeds)
    when({ payment }, ({ payment }) => payment.status === "succeeded")
      .then(() => {
        sendOrderConfirmationStep({
          order_id: order.id,
          customer_email: input.customer_email,
        })
      })

    // Step 6: Allocate to warehouse
    const allocation = allocateToWarehouseStep({
      order_id: order.id,
      items: input.items,
      warehouse_id: input.warehouse_id,
    })

    return new WorkflowResponse({ order, payment, reservation, allocation })
  }
)
```

**What happens if payment fails (step 4)?**

Medusa automatically executes compensations in reverse order:

1. **allocateToWarehouseStep** compensation: Deallocate (if it ran)
2. **sendOrderConfirmationStep** compensation: N/A (didn't run due to `when()`)
3. **processPaymentStep** compensation: Refund (if captured) or void authorization
4. **reserveInventoryStep** compensation: Release inventory reservation
5. **createOrderStep** compensation: Delete order or mark as cancelled
6. **validateInventoryStep** compensation: N/A (read-only)

**Result**: Clean database. No orphaned data. Customer not charged. Inventory not reserved.

## Workflow Hooks

Hooks allow you to inject custom logic into existing workflows:

### Why Hooks?

You want to extend Medusa's core workflows without forking the code.

```typescript
// Core Medusa workflow
export const createProductsWorkflow = createWorkflow(
  "create-products",
  function (input) {
    const products = createProductsStep(input)

    // Hook point: productsCreated
    // Your custom code runs here

    return new WorkflowResponse(products)
  }
)

// Your application - Subscribe to hook
createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    // Your custom logic
    const link = container.resolve("link")

    if (additional_data?.brand_id) {
      await link.create({
        [Modules.BRAND]: { brand_id: additional_data.brand_id },
        [Modules.PRODUCT]: { product_id: products[0].id },
      })
    }

    return new StepResponse("done")
  },
  async (compensationData, { container }) => {
    // Your custom compensation
    if (compensationData?.linkId) {
      const link = container.resolve("link")
      await link.dismiss([compensationData.linkId])
    }
  }
)
```

**Benefits**:
- ✅ Extends core functionality without modifying Medusa code
- ✅ Your logic participates in automatic rollback
- ✅ Upgrade safe - hooks continue to work across Medusa versions
- ✅ Multiple subscribers - multiple hooks can run at the same point

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Using Async/Await in Workflow Function

```typescript
// ❌ WRONG
createWorkflow("wrong", async function (input) {
  const result = await someStep(input)  // ❌ Async/await not allowed!
  return result
})

// ✅ CORRECT
createWorkflow("correct", function (input) {
  const result = someStep(input)  // ✅ Synchronous definition
  return new WorkflowResponse(result)
})
```

**Why**: Workflows are declarative blueprints. Using async/await means executing during definition, which breaks the orchestration model.

### ❌ Anti-Pattern 2: Missing Compensation for State Changes

```typescript
// ❌ WRONG - No compensation for state change
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand)
  }
  // Missing compensation! Brand remains if workflow fails
)

// ✅ CORRECT
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    if (!brandId) return
    const brandService = container.resolve("brand")
    await brandService.deleteBrands([brandId])
  }
)
```

### ❌ Anti-Pattern 3: Business Logic in Workflow Function

```typescript
// ❌ WRONG - Logic in workflow function
createWorkflow("wrong", function (input) {
  const brand = createBrandStep(input)

  // ❌ Business logic in workflow function
  if (brand.name.startsWith("Nike")) {
    const premiumBrand = { ...brand, is_premium: true }
    return new WorkflowResponse(premiumBrand)
  }

  return new WorkflowResponse(brand)
})

// ✅ CORRECT - Logic in steps
createWorkflow("correct", function (input) {
  const brand = createBrandStep(input)

  // Conditional step based on brand data
  when({ brand }, ({ brand }) => brand.name.startsWith("Nike"))
    .then(() => {
      markAsPremiumStep(brand.id)
    })

  return new WorkflowResponse(brand)
})
```

### ❌ Anti-Pattern 4: Direct Database Access in Workflows

```typescript
// ❌ WRONG - Direct database access
createWorkflow("wrong", function (input) {
  const brand = someStepThatDirectlyQueriesDB(input)  // ❌ DB access outside module
  return new WorkflowResponse(brand)
})

// ✅ CORRECT - Database access in steps, steps use modules
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    // ✅ Use module service
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand, brand.id)
  },
  async (brandId, { container }) => {
    const brandService = container.resolve("brand")
    await brandService.deleteBrands([brandId])
  }
)
```

## Summary

Workflow orchestration is essential for building robust Medusa applications:

**Key Concepts**:
- **Workflows coordinate** - They compose steps into business processes
- **Steps execute** - They perform atomic operations
- **Compensation undoes** - Automatic rollback on failure
- **Declarative definition** - Define flow, don't execute
- **Hooks extend** - Add custom logic to core workflows

**Benefits**:
- Automatic rollback (all or nothing)
- Guaranteed cleanup (no orphaned data)
- Code reusability (workflows callable from anywhere)
- Easy testing (test steps independently)
- Easy extension (add steps without rewriting)

**Patterns**:
- Sequential: step2 uses step1's output
- Parallel: independent steps run concurrently
- Conditional: `when()` for branching logic
- Transform: shape data between steps

**Remember**: Workflows are the orchestration layer. They coordinate (don't execute), compose (don't implement), and guarantee cleanup (automatic rollback).
