# Architecture Deep Dive: Module → Workflow → API Route Pattern

This is the fundamental three-layer pattern in Medusa for building features. Understanding this pattern is critical to building maintainable, scalable applications with Medusa.

## The Three-Layer Pattern

```
┌─────────────────────────────────────────────────┐
│  API Route (HTTP Interface Layer)              │
│  - Accepts HTTP requests                       │
│  - Validates input                             │
│  - Executes workflow                           │
│  - Returns HTTP response                       │
│  - No business logic                           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Workflow (Business Logic Orchestration Layer) │
│  - Coordinates multiple steps                  │
│  - Handles rollback via compensation           │
│  - Manages transactions                        │
│  - No HTTP concerns                            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Module (Data Layer)                           │
│  - Defines data models                         │
│  - Provides CRUD operations                    │
│  - Isolated from other modules                 │
│  - No business logic                           │
└─────────────────────────────────────────────────┘
```

## Why This Pattern?

### 1. Separation of Concerns

Each layer has ONE responsibility:

- **API Route**: Handle HTTP (request parsing, response formatting)
- **Workflow**: Orchestrate business logic (coordination, rollback)
- **Module**: Manage data (persistence, retrieval)

**Why this matters**: When you need to change how data is stored (module), you don't touch HTTP logic (route). When you change business rules (workflow), you don't touch data access (module).

### 2. Reusability

Workflows can be called from multiple places:

```typescript
import { createBrandWorkflow } from "../../workflows/create-brand"

// From HTTP API route
export const POST = async (req, res) => {
  const { result } = await createBrandWorkflow(req.scope)
    .run({ input: req.validatedBody })
  res.json({ brand: result })
}

// From another workflow or subscriber
async function mySubscriber(data, { container }) {
  const { result } = await createBrandWorkflow(container)
    .run({ input: { name: data.brandName } })
  return result
}

// From scheduled job
export const importBrands = async (container, brands) => {
  for (const brand of brands) {
    await createBrandWorkflow(container)
      .run({ input: brand })
  }
}
```

**Why this matters**: You write the business logic once, use it everywhere. No code duplication.

### 3. Testability

Each layer can be tested independently:

```typescript
// Test module in isolation
test("creates brand", async () => {
  const brandService = container.resolve("brand")
  const [brand] = await brandService.createBrands([{ name: "Nike" }])
  expect(brand.name).toBe("Nike")
})

// Test workflow in isolation
test("workflow creates brand and sends notification", async () => {
  const { result } = await createBrandWorkflow(container)
    .run({ input: { name: "Nike" } })
  expect(result.brand.name).toBe("Nike")
  expect(mockNotificationService.send).toHaveBeenCalled()
})
```

**Why this matters**: You can test each layer without spinning up the entire application. Tests run faster and are more reliable.

### 4. Rollback and Transactions

Workflows provide automatic rollback through compensation functions:

```typescript
// If any step fails, all previous steps are rolled back
createWorkflow("create-brand-with-s3-upload", function (input) {
  const brand = createBrandStep(input)          // Step 1
  const logo = uploadLogoToS3Step(input.logo)   // Step 2
  const notification = sendSlackNotificationStep(brand) // Step 3
  return new WorkflowResponse({ brand, logo })
})
```

**What happens if step 3 fails?**

1. Step 3 fails (Slack API down)
2. Medusa calls step 2's compensation: Delete logo from S3
3. Medusa calls step 1's compensation: Delete brand from database
4. Entire operation rolled back - database is clean

**Why this matters**: No orphaned data. No manual cleanup. No inconsistent state.

## Anti-Pattern: Direct Service Calls from Routes

### ❌ WRONG

```typescript
// API route that directly calls services (BAD!)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService = req.scope.resolve("brand")
  const s3Service = req.scope.resolve("s3")
  const slackService = req.scope.resolve("slack")

  let brand
  let logoUrl

  try {
    // Create brand
    brand = await brandService.createBrands([req.validatedBody])

    // Upload logo
    logoUrl = await s3Service.upload(req.file)

    // Send notification
    await slackService.notify(`Brand ${brand.name} created!`)

    res.json({ brand })
  } catch (error) {
    // Manual rollback - error-prone!
    if (brand) {
      await brandService.deleteBrands([brand.id])
    }
    if (logoUrl) {
      await s3Service.delete(logoUrl)
    }
    throw error
  }
}
```

**Problems**:
1. ❌ Business logic in HTTP layer - not reusable
2. ❌ Manual rollback - error-prone and hard to maintain
3. ❌ Can't test business logic without HTTP
4. ❌ Multiple concerns mixed (HTTP, business logic, error handling)
5. ❌ Partial failures leave data in inconsistent state if rollback fails

### ✅ CORRECT

```typescript
// Step 1: Define workflow steps with compensation
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
  "upload-logo-to-s3",
  async (input, { container }) => {
    const s3Service = container.resolve("s3")
    const logoUrl = await s3Service.upload(input.logo)
    return new StepResponse(logoUrl, logoUrl)
  },
  async (logoUrl, { container }) => {
    if (!logoUrl) return
    const s3Service = container.resolve("s3")
    await s3Service.delete(logoUrl)
  }
)

const sendSlackNotificationStep = createStep(
  "send-slack-notification",
  async (brand, { container }) => {
    const slackService = container.resolve("slack")
    await slackService.notify(`Brand ${brand.name} created!`)
    return new StepResponse("sent")
  }
)

// Step 2: Compose workflow
export const createBrandWorkflow = createWorkflow(
  "create-brand-with-s3-upload",
  function (input) {
    const brand = createBrandStep(input)
    const logoUrl = uploadLogoStep({ logo: input.logo })
    sendSlackNotificationStep(brand)

    return new WorkflowResponse({
      brand: transform({ brand }, ({ brand }) => brand),
    })
  }
)

// Step 3: Simple API route
import { createBrandWorkflow } from "../../workflows/create-brand"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { result } = await createBrandWorkflow(req.scope)
    .run({ input: req.validatedBody })

  res.json({ brand: result.brand })
}
```

**Benefits**:
1. ✅ Business logic in workflow - reusable from HTTP, GraphQL, CLI, jobs
2. ✅ Automatic rollback - Medusa handles compensation
3. ✅ Each layer testable independently
4. ✅ Clean separation of concerns
5. ✅ All-or-nothing guarantee - either everything succeeds or everything rolls back

## Real-World Example: Complex Workflow

Here's a real-world scenario: Creating a product with inventory, pricing, and warehouse allocation.

```typescript
export const createProductWithInventoryWorkflow = createWorkflow(
  "create-product-with-inventory",
  function (input) {
    // Step 1: Create product in Product Module
    const product = createProductStep(input.product)

    // Step 2: Create pricing in Pricing Module
    const pricing = createPricingStep({
      productId: product.id,
      prices: input.prices,
    })

    // Step 3: Allocate inventory in Inventory Module
    const inventory = allocateInventoryStep({
      productId: product.id,
      quantity: input.quantity,
      warehouseId: input.warehouseId,
    })

    // Step 4: Link to collections in Product Module
    const collections = linkCollectionsStep({
      productId: product.id,
      collectionIds: input.collectionIds,
    })

    // Step 5: Send notification to warehouse
    sendWarehouseNotificationStep({
      productId: product.id,
      warehouseId: input.warehouseId,
    })

    return new WorkflowResponse({ product, pricing, inventory, collections })
  }
)
```

**What happens if step 5 fails (notification service down)?**

Medusa automatically executes compensations in reverse order:
1. Step 4 compensation: Unlink collections
2. Step 3 compensation: Deallocate inventory
3. Step 2 compensation: Delete pricing
4. Step 1 compensation: Delete product

**Result**: Database is clean. No orphaned data. No manual cleanup needed.

## When to Use Each Layer

### Module Layer - Use When You Need To:
- Define data models
- Store/retrieve data
- Perform CRUD operations
- Encapsulate domain logic around a single entity

**DON'T** put business logic here (e.g., "when product is created, send email").

### Workflow Layer - Use When You Need To:
- Coordinate multiple steps
- Handle rollback scenarios
- Orchestrate cross-module operations
- Implement business processes

**DON'T** handle HTTP concerns here (e.g., parsing request body, setting status codes).

### API Route Layer - Use When You Need To:
- Accept HTTP requests
- Validate input
- Execute workflows
- Format HTTP responses

**DON'T** put business logic here (e.g., direct service calls, manual rollback).

## Key Principles

1. **Routes are thin**: They only parse requests and return responses
2. **Workflows orchestrate**: They coordinate steps but don't implement them
3. **Modules encapsulate**: They own their data and provide CRUD operations
4. **Compensation is mandatory**: Every step that creates/modifies data MUST have compensation
5. **Steps are atomic**: Each step does ONE thing and does it well

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Business Logic in Routes

```typescript
// BAD - route contains business logic
export const POST = async (req, res) => {
  const brand = await createBrand(req.body)

  // Business rule in route layer
  if (brand.name.startsWith("Nike")) {
    await sendPremiumNotification(brand)
  } else {
    await sendStandardNotification(brand)
  }
}
```

**Fix**: Move business logic to workflow.

### ❌ Anti-Pattern 2: Workflows Directly Accessing Database

```typescript
// BAD - workflow directly queries database
createWorkflow("create-brand", function (input) {
  const result = someStepThatQueriesDatabase(input)
  // Database access should be in modules, not workflows
})
```

**Fix**: Use module services for all data access.

### ❌ Anti-Pattern 3: Modules with Business Logic

```typescript
// BAD - module contains orchestration logic
class BrandService extends MedusaService(Brand) {
  async createBrand(data) {
    const brand = await this.createBrands([data])
    await this.uploadLogoToS3(data.logo)  // Orchestration!
    await this.sendNotification(brand)     // Orchestration!
    return brand
  }
}
```

**Fix**: Modules provide CRUD operations only. Orchestration goes in workflows.

### ❌ Anti-Pattern 4: Missing Compensation Functions

```typescript
// BAD - step with no compensation
const createBrandStep = createStep(
  "create-brand",
  async (input, { container }) => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([input])
    return new StepResponse(brand)
  }
  // Missing compensation! If later steps fail, brand remains in database
)
```

**Fix**: Always provide compensation for steps that create/modify data.

## Summary

The Module → Workflow → API Route pattern is fundamental to building maintainable, scalable Medusa applications:

- **Modules**: Data layer (CRUD operations)
- **Workflows**: Business logic orchestration (coordination + rollback)
- **API Routes**: HTTP interface (request/response handling)

**Benefits**:
- Separation of concerns
- Reusability (workflows callable from anywhere)
- Testability (test each layer independently)
- Automatic rollback (compensation functions)
- Maintainability (changes isolated to appropriate layer)

**Key Rule**: Each layer has ONE job. Don't mix concerns. Keep routes thin, workflows orchestrative, and modules focused on data.
