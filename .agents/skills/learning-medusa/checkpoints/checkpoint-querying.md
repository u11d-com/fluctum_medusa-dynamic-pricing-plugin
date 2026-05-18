# Checkpoint 2.3: Querying Linked Records

This checkpoint verifies that you've successfully created a GET /admin/brands API route that queries brands with their linked products using Query.graph().

## Verification Questions

Before proceeding, test your understanding:

1. **Why do we use `+brand.*` in the fields parameter?**
   <details>
   <summary>Answer</summary>

   The `+` means "include these fields IN ADDITION to the default fields". Without `+`, you would replace the default fields entirely. The `.*` means "include all fields from the brand relation". So `+brand.*` says "give me all default product fields PLUS all brand fields".
   </details>

2. **What does `req.queryConfig` contain?**
   <details>
   <summary>Answer</summary>

   `req.queryConfig` contains pre-processed query parameters like `fields`, `limit`, `offset`, `order`, and filters. Middleware parses the query string and transforms it into this structured format. You can pass it directly to `query.graph()` to apply user-requested filtering and pagination without manually parsing the query string.
   </details>

3. **Why return count, limit, and offset in the API response?**
   <details>
   <summary>Answer</summary>

   This follows REST pagination best practices. The frontend needs this metadata to:
   - Show total count: "Showing 10 of 50 brands"
   - Implement "Load More" or page navigation
   - Calculate total pages: `Math.ceil(count / limit)`
   - Request next page: `offset + limit`

   Without this metadata, the frontend can't build proper pagination UI.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. API Route File

Show me your `src/api/admin/brands/route.ts` file (the updated version with GET handler).

**Key things to check**:
- [ ] Defines `GET` function (must be named `GET` exactly)
- [ ] Uses types: `MedusaRequest`, `MedusaResponse`
- [ ] Resolves Query service: `req.scope.resolve("query")`
- [ ] Calls `query.graph()` with:
  - `entity: "brand"`
  - Spreads `req.queryConfig`
- [ ] Destructures result: `{ data: brands, metadata: { count, take, skip } = {} }`
- [ ] Returns JSON with brands, count, limit (take), offset (skip)

### 2. Middleware Configuration

Show me the GET /admin/brands middleware configuration in `src/api/middlewares.ts`.

**Key things to check**:
- [ ] Imports `createFindParams` from "@medusajs/medusa/api/utils/validators"
- [ ] Defines `GetBrandsSchema = createFindParams()`
- [ ] Route configuration:
  - Matcher: `"/admin/brands"`
  - Method: `"GET"`
  - Uses `validateAndTransformQuery()` with:
    - Schema: `GetBrandsSchema`
    - Options: `defaults` array includes brand fields and products relation
    - Options: `isList: true`

Example:
```typescript
validateAndTransformQuery(
  GetBrandsSchema,
  {
    defaults: ["id", "name", "products.*"],
    isList: true,
  }
)
```

## Common Issues

### "Empty array returned" even though brands exist

**Symptom**: API returns empty brands array

**Causes and Fixes**:

**Cause 1**: Entity name incorrect
- **Fix**: Use `entity: "brand"` (lowercase, singular)

**Cause 2**: Middleware not configured with defaults
- **Fix**: Add `defaults` to middleware config

**Cause 3**: Module not registered properly
- **Fix**: Check `medusa-config.ts` has brand module

### "metadata is undefined"

**Symptom**: Error accessing count, take, skip

**Cause**: query.graph() doesn't return metadata (should always return it)

**Fix**:
Use default values in destructuring:
```typescript
const {
  data: brands,
  metadata: { count, take, skip } = {}
} = await query.graph({ ... })

res.json({
  brands,
  count: count || 0,
  limit: take || 15,
  offset: skip || 0,
})
```

### "products field not included" in response

**Symptom**: Brand objects don't have products array

**Cause**: Middleware defaults don't include products

**Fix**:
Add to defaults in middleware:
```typescript
validateAndTransformQuery(
  GetBrandsSchema,
  {
    defaults: ["id", "name", "products.*"],
    isList: true,
  }
)
```

### "Validation error: invalid query parameter"

**Symptom**: 400 error when using query parameters

**Cause**: Middleware not configured or using wrong validator

**Fix**:
Ensure you're using `createFindParams()`:
```typescript
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetBrandsSchema = createFindParams()
```

And using `validateAndTransformQuery()` (not `validateAndTransformBody()`):
```typescript
validateAndTransformQuery(GetBrandsSchema, { ... })
```

### Products array empty even though links exist

**Symptom**: brands return but products array is empty

**Causes and Fixes**:

**Cause 1**: Link not created properly
- **Fix**: Check Checkpoint 2.2 - verify links exist in database

**Cause 2**: products.* not in defaults
- **Fix**: Add `"products.*"` to defaults array

**Cause 3**: Link direction is backwards
- **Fix**: Review link definition in Checkpoint 2.1

### "Cannot read property 'result' from undefined"

**Symptom**: Error accessing query result

**Cause**: Incorrect destructuring of query.graph() result

**Fix**:
Use `data` for the result array:
```typescript
const { data: brands } = await query.graph({ ... })
// NOT: const { result: brands }
```

## Architecture Understanding

At this point, you should understand:

**Two ways to query linked data**:

**Method 1: Fields Parameter** (Simple queries)
```typescript
// In a service method
product = await productService.retrieve(id, {
  fields: "+brand.*"
})
```

**Method 2: query.graph()** (Complex queries)
```typescript
// In API routes
const { data } = await query.graph({
  entity: "brand",
  fields: ["id", "name", "products.*"],
  filters: { ... },
  pagination: { ... }
})
```

**Query.graph() data flow**:

```
Request: GET /admin/brands?limit=10&offset=0
                 │
                 ▼
         ┌──────────────┐
         │  Middleware  │ ← Parses query string
         │  validates   │   Transforms to queryConfig
         └──────┬───────┘
                │ req.queryConfig = {
                │   fields: ["id", "name", "products.*"],
                │   take: 10,
                │   skip: 0
                │ }
                ▼
         ┌──────────────┐
         │ Route Handler│
         │ query.graph()│ ← Applies queryConfig
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │   Database   │
         │  + Link      │ ← Joins brand and product tables
         │    Layer     │
         └──────┬───────┘
                │
                ▼
Response: { brands: [...], count, limit, offset }
```

**Why this matters**:
- **Flexibility**: Clients control what data they need
- **Performance**: Only fetch requested fields
- **Pagination**: Handle large datasets efficiently
- **Consistency**: Same query patterns across all entities

## Next Steps

Once this checkpoint passes:

1. **Lesson 2 Complete!** You've extended Medusa's core functionality:
   - Module Link defined (brand ↔ product relationship)
   - Workflow Hook consuming productsCreated
   - Query capability for linked records

2. **Commit your work**:
   ```bash
   git add .
   git commit -m "Complete Lesson 2: Extend Medusa with links and hooks"
   ```

3. **Next: Lesson 3** - Customize Admin Dashboard
   - Create Widget to show brand on product page
   - Create UI Route for brands management page
   - Use React Query and Medusa UI components

**Ready for Lesson 3?** Now that the backend is complete, we'll build the admin UI to manage brands visually.
