# Checkpoint 2.1: Module Links

This checkpoint verifies that you've successfully defined a module link between Brand and Product modules and synced it to the database.

## Verification Questions

Before proceeding, test your understanding:

1. **Why do we use module links instead of directly importing from another module?**
   <details>
   <summary>Answer</summary>

   Module links maintain module isolation - modules don't depend on each other's code. The Brand Module doesn't import Product entities, and Product Module doesn't import Brand entities. This prevents circular dependencies and allows modules to be developed, tested, and deployed independently. Links are managed by Medusa's linking layer, not by direct module-to-module references.
   </details>

2. **What does `isList: true` mean in a link definition?**
   <details>
   <summary>Answer</summary>

   `isList: true` means "one brand can have many products". Without it (or with `isList: false`), the relationship would be one-to-one. In our case, we want one brand (e.g., "Nike") to link to multiple products (shoes, shirts, etc.), so we use `isList: true`.
   </details>

3. **What is the purpose of `BrandModule.linkable.brand`?**
   <details>
   <summary>Answer</summary>

   `linkable` is a configuration object exported from each module that declares which entities can be linked to. `BrandModule.linkable.brand` tells Medusa "the Brand entity in the Brand Module can be used in links".
   </details>

4. **Why do we put links in `src/links` directory and not inside a module?**
   <details>
   <summary>Answer</summary>

   Links are separate from modules to emphasize module independence. A link is a relationship managed by Medusa's linking layer, not by either module. Keeping links in a separate directory makes it clear that they're infrastructure concerns, not business logic. It also makes it easier to see all relationships in your application at a glance.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Brand Module Linkable Configuration

Show me your `src/modules/brand/index.ts` file.

**Key things to check**:
- [ ] Exports module with `Module()`
- [ ] Module has `service` property pointing to BrandService
- [ ] Uses `Modules.BRAND` constant for module name (or string "brand")

### 2. Brand Module Constants

Show me if you created `src/modules/brand/types/index.ts` for module constants.

**Key things to check**:
- [ ] Exports `MODULE_NAME = "brand"`
- [ ] Exports `Modules.BRAND` constant (if using Modules enum)

**Note**: You can also define the constant directly in index.ts or use a string literal.

### 3. Link Definition File

Show me your `src/links/brand-product.ts` file.

**Key things to check**:
- [ ] Imports `defineLink` from "@medusajs/framework/utils"
- [ ] Imports `Modules` from "@medusajs/framework/utils" (for ProductModule reference)
- [ ] Imports `BrandModule` from "../modules/brand"
- [ ] Calls `defineLink()` with two arguments
- [ ] First argument configures product side:
  ```typescript
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  }
  ```
- [ ] Second argument is `BrandModule.linkable.brand`
- [ ] File has default export: `export default defineLink(...)`

### 4. Database Sync

Run the database sync command:

```bash
npx medusa db:sync-links
```

**Expected output**: Should show that link was created successfully without errors. You should see output mentioning the brand-product relationship.

### 5. Build Test

Run build to ensure no TypeScript errors:

```bash
npm run build
```

**Expected output**: Build should succeed without errors related to links or modules.

## Common Issues

### "Link sync failed" or "Cannot resolve module"

**Symptom**: `db:sync-links` command fails

**Cause**: Module not registered in medusa-config.ts, or server not recognizing the module

**Fix**:
1. Verify brand module is in `medusa-config.ts` modules array
2. Restart dev server: `npm run dev`
3. Try sync again: `npx medusa db:sync-links`

## Testing Checklist

Verify each of these steps:

- [ ] Link file created in `src/links/` directory
- [ ] `db:sync-links` command succeeds
- [ ] Build succeeds without TypeScript errors
- [ ] Dev server starts without link-related errors

## Architecture Understanding

At this point, you should understand:

**Module Isolation**:
```
┌─────────────┐           ┌──────────────┐
│   Brand     │           │   Product    │
│   Module    │           │   Module     │
│             │           │              │
│  - No direct imports between modules   │
│  - Each module is independent          │
└─────────────┘           └──────────────┘
       │                         │
       └────────┬────────────────┘
                │
         ┌──────▼────────┐
         │  Link Layer   │
         │  (Medusa)     │
         │               │
         │  Manages      │
         │  relationships│
         └───────────────┘
```

**Why module links matter**:
- **Flexibility**: Modules can be added/removed without breaking others
- **Testability**: Test Brand Module without needing Product Module
- **Scalability**: Modules can be extracted into separate packages
- **Versioning**: Modules can evolve independently

## Next Steps

Once this checkpoint passes:

1. **Module Link** defined between Brand and Product
2. **Database** synced with link relationship
3. **Next**: Consume Workflow Hooks (Part 2 of Lesson 2)

The link is now defined at the infrastructure level. Next, we'll make it functional by consuming the `productsCreated` workflow hook to automatically link brands to products when products are created.

**Ready to continue?** Let me know when all checks pass, and we'll move on to workflow hooks.
