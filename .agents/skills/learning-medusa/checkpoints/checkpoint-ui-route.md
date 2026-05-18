# Checkpoint 3.2: Brands UI Route

This checkpoint verifies that you've successfully created a brands management page with a data table and pagination.

## Verification Questions

Before proceeding, test your understanding:

1. **How does the file path determine the URL of a UI route?**
   <details>
   <summary>Answer</summary>

   The file structure under `src/admin/routes/` maps to URLs under `/app/`. For example:
   - `src/admin/routes/brands/page.tsx` → `/app/brands`
   - `src/admin/routes/settings/team/page.tsx` → `/app/settings/team`

   The file MUST be named `page.tsx` (not `route.tsx` or `index.tsx`). Nested folders create nested routes.
   </details>

2. **Why do we use `sdk.client.fetch()` instead of `sdk.admin.brand.list()`?**
   <details>
   <summary>Answer</summary>

   `sdk.admin.brand.list()` doesn't exist because the `/admin/brands` API route is custom, and the JS SDK only has methods for core API routes. For custom API routes, use `sdk.client.fetch()` which makes a raw HTTP request to any endpoint.
   </details>

3. **What is the purpose of `defineRouteConfig()` and what happens without it?**
   <details>
   <summary>Answer</summary>

   `defineRouteConfig()` adds the route to the admin sidebar navigation and customizes its appearance (label, icon). Without it, the route still exists and is accessible by URL, but users wouldn't see a navigation link. They'd have to type the URL manually or have a link from somewhere else.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Backend API Route (with GET handler)

Show me your updated `src/api/admin/brands/route.ts` file with the GET handler.

**Key things to check**:
- [ ] Defines `GET` function
- [ ] Resolves query service
- [ ] Calls `query.graph()` with:
  - `entity: "brand"`
  - Spreads `req.queryConfig`
- [ ] Returns JSON with brands, count, limit, offset

**Note**: You should have already created this in Checkpoint 2.3. If not, create it now.

### 2. Backend Middleware Configuration

Show me the GET /admin/brands configuration in `src/api/middlewares.ts`.

**Key things to check**:
- [ ] Route matcher: `"/admin/brands"`
- [ ] Method: `"GET"`
- [ ] Uses `validateAndTransformQuery()` with:
  - `GetBrandsSchema` (from `createFindParams()`)
  - Options with `defaults` and `isList: true`

**Note**: You should have already created this in Checkpoint 2.3. If not, create it now.

### 3. UI Route File

Show me your `src/admin/routes/brands/page.tsx` file.

**Key things to check**:
- [ ] Imports `defineRouteConfig` from "@medusajs/admin-sdk"
- [ ] Imports icon (e.g., `TagSolid`) from "@medusajs/icons"
- [ ] Imports UI components: `Container`, `Heading`, `DataTable`, etc. from "@medusajs/ui"
- [ ] Imports `useQuery` from "@tanstack/react-query"
- [ ] Imports `sdk` from "../../lib/sdk"
- [ ] Imports React hooks: `useState`, `useMemo`
- [ ] Defines `Brand` type with id, name, products
- [ ] Defines `BrandsResponse` type with brands, count, limit, offset
- [ ] Creates columns using `createDataTableColumnHelper<Brand>()`
- [ ] Defines at least 3 columns: id, name, products (showing count)
- [ ] Component has pagination state: `useState({ pageSize, pageIndex })`
- [ ] Calculates offset from pagination state
- [ ] useQuery:
  - Calls `sdk.client.fetch()` with `/admin/brands` and query params
  - Query key includes limit and offset
  - Types response as `BrandsResponse`
- [ ] Uses `useDataTable()` hook with columns, data, rowCount, pagination
- [ ] Renders DataTable with Toolbar, Table, and Pagination
- [ ] Exports config with label and icon
- [ ] Default exports component

### 4. Test: Access UI Route

1. Ensure dev server is running: `npm run dev`
2. Open admin: http://localhost:9000/app
3. Look for "Brands" in the sidebar navigation

**Expected**: You should see a "Brands" menu item with the icon you chose.

### 5. Test: View Brands Page

1. Click the "Brands" menu item
2. View the brands table

**Expected**:
- Page displays with "Brands" heading
- Table shows columns: ID, Name, Products (count)
- Table shows all brands you've created
- Products column shows the number of products linked to each brand

### 6. Test: Product Count Accuracy

1. Look at the Products column for each brand
2. Verify the count matches the actual number of products linked

**Expected**: Count should be accurate (0 for brands with no products, 1+ for brands with products).

## Common Issues

### Route not showing in sidebar

**Symptom**: Can't find "Brands" in navigation

**Causes and Fixes**:

**Cause 1**: Config not exported
- **Fix**: Ensure you export config:
  ```typescript
  export const config = defineRouteConfig({
    label: "Brands",
    icon: TagSolid,
  })
  ```

**Cause 2**: File not named correctly
- **Fix**: Must be named `page.tsx` (not `route.tsx`)

**Cause 3**: File not in correct location
- **Fix**: Should be at `src/admin/routes/brands/page.tsx`

### "404 Not Found" when accessing /app/brands

**Symptom**: Clicking link results in 404

**Cause**: File structure incorrect

**Fix**:
Ensure the structure is:
```
src/admin/routes/brands/page.tsx
```

NOT:
```
src/admin/routes/brands.tsx  ❌
src/admin/routes/brands/index.tsx  ❌
```

### Table shows empty / no data

**Symptom**: Table renders but shows no brands

**Causes and Fixes**:

**Cause 1**: Backend API not working
- **Fix**: Test API directly: `curl http://localhost:9000/admin/brands`
- If API returns data, issue is in frontend
- If API returns empty, issue is in backend (see Checkpoint 2.3)

**Cause 2**: Query not fetching data
- **Fix**: Check browser DevTools Console for errors
- Check Network tab - is request being made?

**Cause 3**: Data structure mismatch
- **Fix**: Check that API returns `{ brands: [...] }` format
- Ensure useQuery is typed as `BrandsResponse`

### "Cannot read property 'length' of undefined"

**Symptom**: Runtime error accessing products

**Cause**: Trying to access products.length when products might be undefined

**Fix**:
Use optional chaining in column definition:
```typescript
columnHelper.accessor("products", {
  header: "Products",
  cell: ({ getValue }) => {
    const products = getValue()
    return products?.length || 0
  },
})
```

### Pagination not working / always shows same data

**Symptom**: Clicking next page doesn't change data

**Causes and Fixes**:

**Cause 1**: offset not calculated correctly
- **Fix**: Ensure offset = pageIndex * pageSize

**Cause 2**: Query key doesn't include pagination
- **Fix**: Include offset in queryKey:
  ```typescript
  queryKey: ["brands", limit, offset]
  ```

**Cause 3**: Backend not using offset parameter
- **Fix**: Verify middleware passes offset to query.graph()

### "Cannot use sdk.client.fetch"

**Symptom**: TypeScript error or runtime error

**Cause**: SDK not initialized

**Fix**:
1. Ensure `src/admin/lib/sdk.ts` exists and exports sdk
2. Import correctly: `import { sdk } from "../../lib/sdk"`
3. Check the number of `../` matches your file structure

### Table styling looks broken

**Symptom**: Table appears unstyled or layout is wrong

**Cause**: Not using DataTable components correctly

**Fix**:
Use the full DataTable component structure:
```tsx
<DataTable instance={table}>
  <DataTable.Toolbar>
    <Heading>Brands</Heading>
  </DataTable.Toolbar>
  <DataTable.Table />
  <DataTable.Pagination />
</DataTable>
```

### "Cannot find module '@medusajs/icons'"

**Symptom**: Import error for icons

**Cause**: Package not installed

**Fix**:
Icons are included with Medusa admin. Check import:
```typescript
import { TagSolid } from "@medusajs/icons"
```

If still not working, ensure admin dependencies are installed:
```bash
npm install
```

### Products count shows 0 for all brands

**Symptom**: Table shows 0 products even though links exist

**Causes and Fixes**:

**Cause 1**: Backend not including products in response
- **Fix**: Check middleware defaults include `"products.*"`

**Cause 2**: Links not created
- **Fix**: Verify links exist (see Checkpoint 2.2)

**Cause 3**: Column accessing wrong property
- **Fix**: Ensure column accessor matches API response structure

### Route accessible by URL but not in sidebar

**Symptom**: Can access http://localhost:9000/app/brands but no sidebar link

**Cause**: Config not exported or exported incorrectly

**Fix**:
Must export config as named export:
```typescript
export const config = defineRouteConfig({ ... })
```

NOT:
```typescript
export default defineRouteConfig({ ... })  ❌
```

## Testing Checklist

Verify each of these steps:

- [ ] Backend GET /admin/brands API working (test with cURL)
- [ ] Route appears in sidebar navigation with icon
- [ ] Clicking "Brands" navigates to /app/brands
- [ ] Table displays with proper styling
- [ ] Table shows all brands with columns: ID, Name, Products
- [ ] Products column shows accurate count
- [ ] Pagination controls appear (if 15+ brands)
- [ ] Pagination works (can navigate pages)
- [ ] No console errors in browser DevTools

## Architecture Understanding

At this point, you should understand:

**UI Route structure**:

```
File System                      URL                  Sidebar
src/admin/routes/brands/page.tsx → /app/brands     → "Brands" link
                ↓
        defineRouteConfig()
          - label: "Brands"
          - icon: TagSolid
```

**Data flow for UI routes**:

```
1. User clicks "Brands" in sidebar
                │
                ▼
2. React Router navigates to /app/brands
                │
                ▼
3. BrandsPage component renders
                │
                ▼
4. useQuery fetches data
   - sdk.client.fetch("/admin/brands")
   - With limit & offset params
                │
                ▼
5. Backend: GET /admin/brands
   - Middleware validates query
   - Route handler calls query.graph()
   - Returns { brands, count, limit, offset }
                │
                ▼
6. Frontend: DataTable renders
   - Shows brands in table
   - Pagination controls use count & limit
```

**Complete feature architecture** (all 3 lessons):

```
┌─────────────────────────────────────────────────┐
│  Admin UI (Lesson 3)                            │
│  - Widget: Shows brand on product page          │
│  - UI Route: Brands management page             │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────────────┐
│  API Routes (Lesson 1 & 2)                      │
│  - POST /admin/brands (create)                  │
│  - GET /admin/brands (list with products)       │
└─────────────────┬───────────────────────────────┘
                  │ Executes
                  ▼
┌─────────────────────────────────────────────────┐
│  Workflows (Lesson 1 & 2)                       │
│  - createBrandWorkflow (with rollback)          │
│  - productsCreated hook (auto-link)             │
└─────────────────┬───────────────────────────────┘
                  │ Uses
                  ▼
┌─────────────────────────────────────────────────┐
│  Modules & Links (Lesson 1 & 2)                 │
│  - Brand Module (data & service)                │
│  - Module Link (brand ↔ product)                │
└─────────────────────────────────────────────────┘
```

## Next Steps

Once this checkpoint passes:

1. **Lesson 3 Complete!** You've built a complete admin UI:
   - SDK initialized for API calls
   - Product Brand Widget on product pages
   - Brands UI Route with data table and pagination

2. **ALL LESSONS COMPLETE!** 🎉 You've built a complete feature:

   **Backend**:
   - Brand Module (data model, service)
   - createBrandWorkflow (with rollback)
   - POST /admin/brands (create brand API)
   - Module Link (brand ↔ product)
   - Workflow Hook (auto-link on product creation)
   - GET /admin/brands (list brands with products)

   **Frontend**:
   - Product Brand Widget (show brand on product page)
   - Brands UI Route (manage brands with table)

3. **Commit your work**:
   ```bash
   git add .
   git commit -m "Complete Lesson 3: Admin dashboard customization"
   ```

4. **What's Next?**

   **You now understand Medusa's architecture** and can build custom features independently:
   - Module → Workflow → API Route pattern
   - Module Links for cross-module relationships
   - Workflow Hooks for extending core functionality
   - Admin customization with Widgets and UI Routes

   **Consider building**:
   - Categories Module (similar to Brand)
   - Product Reviews feature
   - Wishlists
   - Custom shipping methods
   - Inventory alerts

   **Learn more**:
   - Advanced Workflow Patterns
   - Complex Admin Components
   - Storefront Integration
   - Testing your features

**Congratulations!** 🎊 You've completed the interactive Medusa learning tutorial. You're now ready to build production features with Medusa.
