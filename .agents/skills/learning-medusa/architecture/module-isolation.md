# Architecture Deep Dive: Module Isolation

Module isolation is a core principle in Medusa's architecture. Understanding why modules must be isolated and how to work within this constraint is essential for building scalable applications.

## What is Module Isolation?

**Module isolation** means that modules do NOT directly depend on each other's code. They cannot import types, services, or entities from other modules.

```
❌ WRONG - Direct dependency between modules
┌──────────────┐
│Brand Module  │
│              │───imports───▶ ┌──────────────┐
│import Product│              │Product Module│
│from "../product"            │              │
└──────────────┘              └──────────────┘

✅ CORRECT - Modules are isolated
┌──────────────┐              ┌──────────────┐
│Brand Module  │              │Product Module│
│              │              │              │
│   Isolated   │              │   Isolated   │
└──────┬───────┘              └──────┬───────┘
       │                             │
       └──────────┬──────────────────┘
                  ▼
           ┌─────────────┐
           │ Link Layer  │
           │  (Medusa)   │
           └─────────────┘
```

## Why Module Isolation Matters

### 1. No Circular Dependencies

Without isolation, modules can create circular dependency chains:

```
❌ Without isolation - Circular dependencies possible
Brand Module ──imports──▶ Product Module
      ▲                        │
      │                        │
      └────────imports─────────┘

Result: Build fails, runtime errors, maintenance nightmare
```

With isolation, circular dependencies are impossible:

```
✅ With isolation - No circular dependencies
Brand Module ←─────Link Layer─────▶ Product Module
  (Isolated)                         (Isolated)

Result: Clean architecture, predictable builds
```

### 2. Independent Development and Testing

Isolated modules can be developed and tested independently:

```typescript
// Test Brand Module WITHOUT needing Product Module
describe("Brand Module", () => {
  it("creates brand", async () => {
    const brandService = container.resolve("brand")
    const [brand] = await brandService.createBrands([{ name: "Nike" }])
    expect(brand.name).toBe("Nike")
  })
})

// Test Product Module WITHOUT needing Brand Module
describe("Product Module", () => {
  it("creates product", async () => {
    const productService = container.resolve("product")
    const [product] = await productService.createProducts([{ title: "Shoe" }])
    expect(product.title).toBe("Shoe")
  })
})
```

**Why this matters**: You can test Brand Module even if Product Module is broken. Tests are faster and more reliable.

### 3. Module Extraction and Reusability

Isolated modules can be extracted into separate packages and reused:

```
Project A: E-commerce Platform
├── @mycompany/brand-module     ◀─┐
├── @mycompany/product-module     │ Can be extracted
├── @mycompany/review-module      │ into npm packages
└── ...                           │
                                  │
Project B: Marketplace Platform   │
├── @mycompany/brand-module     ◀─┘ Reused!
├── different-product-module
└── ...
```

**Why this matters**: Write once, use in multiple projects. Build a library of reusable modules.

### 4. Versioning and Independent Updates

Isolated modules can be versioned and updated independently:

```
Brand Module v1.0.0 ──────▶ Brand Module v2.0.0
      │                           │
      │                           │ Breaking changes allowed
      │                           │ because no direct dependencies
      ▼                           ▼
Link Layer ──────────────▶ Link Layer
(Interface stays stable)  (Interface stays stable)
```

**Why this matters**: Update Brand Module without breaking Product Module. Deploy modules independently.

## How Module Links Work

Since modules can't import from each other, Medusa provides a **link layer** to manage relationships:

```typescript
// ❌ WRONG - Cannot do this!
// In Product Module
import { Brand } from "../brand/models/brand"

interface Product {
  brand: Brand  // Direct reference to Brand entity
}
```

```typescript
// ✅ CORRECT - Use Module Links
// Define link (separate from both modules)
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  BrandModule.linkable.brand
)
```

### Link Layer Data Flow

```
1. Application defines link
   defineLink(Product, Brand)
                │
                ▼
2. Medusa creates link table in database
   ┌──────────────────┐
   │ link_brand_product│
   ├──────────────────┤
   │ product_id       │
   │ brand_id         │
   └──────────────────┘
                │
                ▼
3. Query layer handles joins
   query.graph({
     entity: "brand",
     fields: ["id", "name", "products.*"]
   })
   ↓
   SELECT brand.*, product.*
   FROM brand
   LEFT JOIN link_brand_product ON brand.id = link.brand_id
   LEFT JOIN product ON link.product_id = product.id
```

**Key insight**: Links are managed by Medusa's infrastructure, not by your modules. Modules remain isolated.

## Working with Module Isolation

### Pattern 1: Query for Linked Data

When you need data from multiple modules, use Query layer:

```typescript
// In API route (not in module!)
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  const { data: brands } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "products.*"],
  })

  res.json({ brands })
}
```

**Why this works**: Query layer has access to all modules and links. It orchestrates cross-module queries.

### Pattern 2: Workflow Hooks for Cross-Module Logic

When you need to react to events in other modules, use workflow hooks:

```typescript
// In your application (not in Brand Module!)
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const link = container.resolve("link")

    const links = products
      .filter((p) => additional_data?.brand_id)
      .map((product) => ({
        [Modules.BRAND]: { brand_id: additional_data.brand_id },
        [Modules.PRODUCT]: { product_id: product.id },
      }))

    await link.create(links)
    return new StepResponse(links, links)
  },
  async (links, { container }) => {
    if (!links?.length) return
    const link = container.resolve("link")
    await link.dismiss(links)
  }
)
```

**Why this works**: Hook is in your application layer (not in either module). It coordinates between modules without creating dependencies.

### Pattern 3: Shared Types via Interfaces

If you need to share types, use interfaces (not concrete types):

```typescript
// shared/interfaces.ts (not in any module)
export interface IBrand {
  id: string
  name: string
}

export interface IProduct {
  id: string
  title: string
  brand_id?: string  // Reference by ID, not by entity
}

// In Brand Module - implements interface
export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
})
// Brand entity implements IBrand structurally

// In workflow - uses interface
async function processBrandProducts(brand: IBrand, products: IProduct[]) {
  // Works with both modules without importing from them
}
```

**Why this works**: Interfaces don't create runtime dependencies. Modules implement them structurally without imports.

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Direct Module Imports

```typescript
// In Product Module service
import { BrandService } from "../brand/service"  // ❌ WRONG!

class ProductService extends MedusaService(Product) {
  async createProductWithBrand(data) {
    const brandService = new BrandService()  // ❌ Direct dependency!
    const brand = await brandService.getBrand(data.brand_id)
    // ...
  }
}
```

**Fix**: Use dependency injection and link layer:

```typescript
// In workflow (application layer)
createWorkflow("create-product-with-brand", function (input) {
  const product = createProductStep(input.product)
  const link = linkProductToBrandStep({
    productId: product.id,
    brandId: input.brand_id,
  })
  return new WorkflowResponse({ product, link })
})
```

### ❌ Anti-Pattern 2: Shared Entity Types

```typescript
// brand/models/brand.ts
export const Brand = model.define("brand", { ... })

// product/models/product.ts
import { Brand } from "../brand/models/brand"  // ❌ WRONG!

export const Product = model.define("product", {
  id: model.id(),
  title: model.text(),
  brand: Brand,  // ❌ Direct entity reference!
})
```

**Fix**: Use module links:

```typescript
// product/models/product.ts - NO brand reference
export const Product = model.define("product", {
  id: model.id(),
  title: model.text(),
  // No brand field! Relationship is in link layer
})

// links/brand-product.ts - Relationship defined separately
export default defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  BrandModule.linkable.brand
)
```

### ❌ Anti-Pattern 3: Cross-Module Transactions

```typescript
// In Brand Module service
class BrandService extends MedusaService(Brand) {
  async createBrandWithProducts(brandData, productData) {
    const brand = await this.createBrands([brandData])

    // ❌ WRONG! Brand Module shouldn't know about Product Module
    const productService = this.container.resolve("product")
    const products = await productService.createProducts(productData)

    return { brand, products }
  }
}
```

**Fix**: Use workflow to orchestrate:

```typescript
// In workflow (application layer)
export const createBrandWithProductsWorkflow = createWorkflow(
  "create-brand-with-products",
  function (input) {
    const brand = createBrandStep(input.brand)
    const products = createProductsStep(input.products)
    const links = linkProductsToBrandStep({
      brandId: brand.id,
      productIds: products.map((p) => p.id),
    })

    return new WorkflowResponse({ brand, products, links })
  }
)
```

## Real-World Example: Order with Custom Brand Requirements

Scenario: When an order is placed, you need to validate that all products are from approved brands.

### ❌ WRONG Approach - Breaking Module Isolation

```typescript
// In Order Module (❌ WRONG!)
import { BrandService } from "../brand/service"

class OrderService extends MedusaService(Order) {
  async createOrder(data) {
    const brandService = new BrandService()  // ❌ Direct dependency!

    for (const item of data.items) {
      const product = await this.getProduct(item.product_id)
      const brand = await brandService.getBrand(product.brand_id)

      if (!brand.is_approved) {
        throw new Error("Brand not approved")
      }
    }

    return this.createOrders([data])
  }
}
```

**Problems**:
- ❌ Order Module depends on Brand Module
- ❌ Order Module depends on Product Module
- ❌ Can't test Order Module without Brand Module
- ❌ Can't extract Order Module to separate package

### ✅ CORRECT Approach - Maintaining Module Isolation

```typescript
// In workflow (application layer)
const validateBrandApprovalStep = createStep(
  "validate-brand-approval",
  async (input, { container }) => {
    const query = container.resolve("query")

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "brand.*"],
      filters: { id: input.productIds },
    })

    for (const product of products) {
      if (product.brand && !product.brand.is_approved) {
        throw new Error(`Brand ${product.brand.name} is not approved`)
      }
    }

    return new StepResponse(true)
  }
)

export const createOrderWorkflow = createWorkflow(
  "create-order",
  function (input) {
    const productIds = input.items.map((item) => item.product_id)

    // Step 1: Validate brand approval
    validateBrandApprovalStep({ productIds })

    // Step 2: Create order (Order Module isolated)
    const order = createOrderStep(input)

    return new WorkflowResponse(order)
  }
)
```

**Benefits**:
- ✅ Order Module remains isolated
- ✅ Brand validation is in workflow (application layer)
- ✅ Each module can be tested independently
- ✅ Modules can be extracted to separate packages

## Summary

Module isolation is fundamental to building scalable, maintainable Medusa applications:

**Key Principles**:
- ✅ Modules NEVER import from other modules
- ✅ Use link layer for relationships
- ✅ Use Query layer for cross-module reads
- ✅ Use workflow hooks for cross-module writes
- ✅ Keep business logic in workflows, not modules

**Benefits**:
- ✅ No circular dependencies
- ✅ Independent development and testing
- ✅ Module extraction and reusability
- ✅ Independent versioning and updates

**Remember**: Isolation is a feature, not a limitation. It enables scalability, testability, and maintainability at the cost of slightly more indirection.
