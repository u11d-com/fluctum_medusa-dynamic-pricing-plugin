# Plugin Release Runbook — @u11d/medusa-dynamic-pricing

This guide covers the manual release process for the `@u11d/medusa-dynamic-pricing` plugin. The release is triggered by a git tag and handled by GitHub Actions.

## Prerequisites

- Access to the `u11d-com` GitHub repository.
- NPM account with write access to the `@u11d` scope.
- `NPM_TOKEN` configured in GitHub repository secrets.

## Release Steps

### 1. Verification

Before bumping the version, ensure the plugin builds correctly and the publish command is valid.

```bash
cd dynamic-pricing-plugin

# 1. Clean build
npm run build

# 2. Dry run publish (checks files and provenance requirements)
npm publish --dry-run
```

### 2. Manual Version Bump

We do not use automated tools like Changesets or Semantic Release. The version must be bumped manually in the `package.json`.

1.  Edit `dynamic-pricing-plugin/package.json` and update the `"version"` field (e.g., from `0.0.1` to `0.0.2`).
2.  Commit the change:

```bash
git add package.json
git commit -m "chore(plugin): bump to v0.0.2"
```

### 3. Tag and Push

The GitHub Actions workflow triggers specifically on tags matching the `v*.*.*` pattern.

```bash
# Create the tag
git tag v0.0.2

# Push the tag to trigger the release workflow
git push origin v0.0.2
```

## Post-Release Verification

1.  Monitor the **Release** workflow in GitHub Actions: `.github/workflows/release.yml`.
2.  Verify the package is available on NPM: `https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing`.
3.  Check the **Provenance** tab on the NPM package page to ensure SLSA attestation was successfully published.

> **Note:** Once a package version is successfully published to NPM, it cannot be republished with the same version number. You must bump the version again (e.g., `v0.0.3`) to fix any issues.

## Security & Provenance

The release workflow is configured with `id-token: write` permissions. This allows `npm publish` to generate a **SLSA (Supply-chain Levels for Software Artifacts)** attestation using the `--provenance` flag. This provides a verifiable link between the published package and the GitHub Actions run that built it.
