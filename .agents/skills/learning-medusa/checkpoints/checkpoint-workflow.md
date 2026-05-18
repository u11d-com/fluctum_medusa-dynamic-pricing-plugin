# Checkpoint 1.2: Brand Workflow

This checkpoint verifies that you've successfully created the createBrandWorkflow with a step and compensation function.

## Verification Questions

Before proceeding, test your understanding:

1. **Why can't we use `async` or `await` in the workflow function?**
   <details>
   <summary>Answer</summary>

   Workflows are declarative blueprints that define the sequence of steps. They don't execute steps directly - the workflow engine does. Using `async`/`await` would mean executing steps during definition, which breaks the orchestration model. Steps are called synchronously in the workflow function, and the engine handles the async execution.
   </details>

2. **What is a compensation function and why do we need it?**
   <details>
   <summary>Answer</summary>

   A compensation function is the "undo" logic for a step. If a later step in the workflow fails, Medusa automatically calls compensation functions for all completed steps in reverse order. This provides automatic rollback - for example, if brand creation succeeds but a later S3 upload fails, the compensation function deletes the brand to maintain data consistency.
   </details>

3. **What does `StepResponse` do?**
   <details>
   <summary>Answer</summary>

   `StepResponse` returns two things: (1) the data to pass to the next step, and (2) the data to pass to the compensation function if rollback is needed. This lets you return different data for success vs. rollback scenarios.
   </details>

4. **Why do we use `transform()` instead of directly returning workflow input?**
   <details>
   <summary>Answer</summary>

   `transform()` is a utility that extracts and shapes data from step results. It ensures type safety and makes it clear what data is being returned. While you could return step results directly, `transform()` provides better code readability and type inference.
   </details>

## Implementation Check

Let me verify your implementation. Please share the following:

### 1. Step File

Show me your `src/workflows/create-brand/steps/create-brand.ts` file.

**Key things to check**:
- [ ] Step function is defined with `createStep()`
- [ ] Step name is descriptive (e.g., "create-brand")
- [ ] Input has proper TypeScript type
- [ ] Uses `container.resolve("brand")` to get service
- [ ] Calls `brandService.createBrands()` (note the plural - it's a batch method)
- [ ] Returns `new StepResponse(brand, brand.id)` (brand for next step, id for compensation)
- [ ] Compensation function accepts `brandId` parameter
- [ ] Compensation resolves service and calls `deleteBrands([brandId])`
- [ ] Has null check: `if (!brandId) return`

### 2. Workflow File

Show me your `src/workflows/create-brand/index.ts` file.

**Key things to check**:
- [ ] Uses `createWorkflow()` with unique name
- [ ] Workflow function is NOT async
- [ ] Workflow function does NOT use await
- [ ] Workflow function is NOT an arrow function (uses `function` keyword)
- [ ] Calls `createBrandStep(input)` without await
- [ ] Uses `transform()` to extract brand from step result
- [ ] Returns `new WorkflowResponse(brand)`

### 3. Build Test

Run this command and share any errors:

```bash
npm run build
```

**Expected output**: Build should succeed. TypeScript should not complain about the workflow.

## Common Issues

### "Async function not allowed in workflow"

**Symptom**: TypeScript error or runtime warning about async

**Cause**: Workflow function declared as `async function`

**Fix**:
Remove `async` keyword:
```typescript
// ❌ WRONG
createWorkflow("create-brand", async function (input) {
  // ...
})

// ✅ CORRECT
createWorkflow("create-brand", function (input) {
  // ...
})
```

### "Cannot use await in workflow"

**Symptom**: Error about await usage

**Cause**: Using `await` when calling steps

**Fix**:
Remove `await` - steps are called synchronously:
```typescript
// ❌ WRONG
const result = await createBrandStep(input)

// ✅ CORRECT
const result = createBrandStep(input)
```

### "Cannot resolve brand"

**Symptom**: Runtime error when executing workflow

**Cause**: Service name doesn't match module registration

**Fix**:
Use exact service name with "ModuleService" suffix:
```typescript
const brandService = container.resolve("brand")
```

## Testing Checklist

Verify each of these steps:

- [ ] Build succeeds without errors
- [ ] No TypeScript warnings about async/await
- [ ] Step file has both step function and compensation
- [ ] Workflow file uses correct syntax (function, no async, no await)
- [ ] Compensation function has null check
- [ ] Service methods use plural names (createBrands, deleteBrands)
- [ ] StepResponse returns both result and compensation data

## Architecture Understanding

At this point, you should understand:

- **Workflows are declarative**: They define the flow, not execute it
- **Steps are composable**: You can reuse steps across workflows
- **Compensation provides safety**: Automatic rollback on failure
- **The engine handles execution**: Steps run async, but you define them sync

**Example of why this matters**:

Imagine this workflow:
1. Create brand
2. Upload logo to S3
3. Send Slack notification

If step 3 fails, the compensation functions for steps 2 and 1 run automatically:
- Delete logo from S3
- Delete brand from database

This ensures your system never ends up in an inconsistent state - all or nothing.

## Next Steps

Once this checkpoint passes:

1. **Brand Module** created
2. **Brand Workflow** created with rollback
3. **Next**: Create the API Route (Part 3 of Lesson 1)

The workflow provides the business logic orchestration. Now we'll expose it via an HTTP API route that validates input and executes the workflow.

**Ready to continue?** Let me know when all checks pass, and we'll move on to creating the API route.
