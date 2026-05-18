# Checkpoint 1.1: Brand Module

This checkpoint verifies that you've successfully created the Brand Module with its data model, service, and migrations.

## Verification Questions

Before proceeding, test your understanding:

1. **What does `MedusaService()` do?**
   <details>
   <summary>Answer</summary>

   `MedusaService()` is a service factory provided by Medusa that generates a service with CRUD methods (create, update, retrieve, list, delete) for your data model. It saves you from writing boilerplate code.
   </details>

2. **Why is the module name "brand" and not "brand-module"?**
   <details>
   <summary>Answer</summary>

   Medusa uses camelCase naming for modules and automatically adds "Module" as a suffix when resolving dependencies. So "brand" becomes "brandModule" internally. Using "brand-module" would result in "brandModuleModule".
   </details>

3. **What would happen if you forgot to run migrations?**
   <details>
   <summary>Answer</summary>

   The `brand` table wouldn't exist in your database, and any attempt to create or retrieve brands would fail with database errors like "relation 'brand' does not exist".
   </details>

4. **Why do we need to export both the service AND the module from index.ts?**
   <details>
   <summary>Answer</summary>

   Exporting the service makes it available for dependency injection in workflows and API routes.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Directory Structure

Run this command and share the output:

```bash
ls -R src/modules/brand
```

**Expected structure**:
```
src/modules/brand:
index.ts  models  service.ts

src/modules/brand/models:
brand.ts
```

### 2. Data Model

Show me your `src/modules/brand/models/brand.ts` file.

**Key things to check**:
- [ ] Uses `model.define()` with "brand" as first argument (lowercase, snake-case)
- [ ] Has `id: model.id().primaryKey()`
- [ ] Has `name: model.text()`
- [ ] File is exported as default

### 3. Service

Show me your `src/modules/brand/service.ts` file.

**Key things to check**:
- [ ] Uses `MedusaService(Brand)` (capital B for the model import)
- [ ] File is exported as default

### 4. Module Definition

Show me your `src/modules/brand/index.ts` file.

**Key things to check**:
- [ ] Exports `BrandService` from service.ts
- [ ] Uses `Module()` with name "brand" (lowercase)
- [ ] Exports module as default

### 5. Configuration

Show me the `modules` section of your `medusa-config.ts`.

**Key things to check**:
- [ ] Includes `resolve: "./modules/brand"`
- [ ] Has empty `options: {}`

### 6. Migrations

Run this command and share the output:

```bash
npx medusa db:migrate
```

**Expected output**: Should show migration succeeded without errors.

### 7. Build

Run this command and share any errors:

```bash
npm run build
```

**Expected output**: Build should succeed. If there are TypeScript errors, share them with me so we can debug together.

## Common Issues

### "Cannot find module 'brand'"

**Symptom**: Error when running build or starting server

**Cause**: Module not registered in `medusa-config.ts`

**Fix**:
1. Open `medusa-config.ts`
2. Add to `modules` array:
   ```typescript
   {
     resolve: "./modules/brand",
     options: {},
   }
   ```
3. Restart dev server

### "Module name must be camelCase"

**Symptom**: Error about module naming convention

**Cause**: Used "brand-module" or "brandModule" as module name

**Fix**:
Change module name to just "brand" in `index.ts`:
```typescript
export default Module("brand", {
  service: BrandService,
})
```

## Testing Checklist

Verify each of these steps:

- [ ] Migration succeeded without errors
- [ ] Build succeeds without TypeScript errors
- [ ] Module appears in `medusa-config.ts` modules array
- [ ] File structure matches expected pattern
- [ ] Data model uses correct DML syntax
- [ ] Service uses MedusaService factory
- [ ] Module exports service

## Next Steps

Once this checkpoint passes:

1. **Brand Module** is created and working
2. **Next**: Create the Brand Workflow (Part 2 of Lesson 1)

The module provides the data layer. Now we'll build the workflow to orchestrate brand creation with automatic rollback capabilities.

**Ready to continue?** Let me know when all checks pass, and we'll move on to creating the workflow.
