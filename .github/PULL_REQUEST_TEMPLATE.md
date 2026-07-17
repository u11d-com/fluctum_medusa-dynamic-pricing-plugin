## Description

A clear description of what this PR does.

Closes #(issue number if applicable)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist

- [ ] I have followed the code conventions documented in [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] I have used only `GET`, `POST`, `DELETE` HTTP methods (no `PUT`/`PATCH`)
- [ ] All data mutations go through Medusa workflows
- [ ] I have not used `any`, `@ts-ignore`, or `as` type casts
- [ ] I have not written to Medusa's price tables
- [ ] Prices are stored as decimal numbers (not cents)
- [ ] I have added/updated tests for my changes
- [ ] All tests pass locally (`pnpm run test:unit` in `dynamic-pricing-plugin/` and/or `pnpm run test:integration` in `starter/backend/`)
- [ ] I have added necessary documentation updates

## Testing

Describe the testing you've done:

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing (describe scenarios)

## Additional Notes

Any additional information reviewers should know.
