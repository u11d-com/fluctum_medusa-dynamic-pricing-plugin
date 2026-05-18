---
name: mcloud-deployments
description: Execute mcloud deployments commands to list deployments, retrieve deployment details, and fetch build logs. Use when listing deployments, checking deployment status, or reading build output for debugging build failures.
allowed-tools: Bash(mcloud deployments*), Bash(jq*)
---

# Cloud CLI: Deployments Commands

Execute `mcloud deployments` commands to inspect deployments and their build logs.

## Constraints

- Always pass `--json` when parsing output — plaintext format may change.
- Always confirm context (`mcloud whoami --json`) before running commands if org/project are not already known.
- Use `--deployment` IDs in the format `depl_*` or build IDs; build IDs resolve to their latest deployment automatically.

## Commands

### deployments list

List recent deployments for a project (default: 20 most recent across all environments).

```bash
mcloud deployments list --organization <org-id> --project <project-id-or-handle> --json
```

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context)
- `-p/--project <id-or-handle>` — Project ID or handle (falls back to active context)
- `-e/--environment <handle>` — Filter by environment handle
- `--environment-type <production|long-lived|preview>` — Filter by environment type
- `--commit <sha>` — Filter by Git commit SHA (full or prefix)
- `--limit <1-200>` — Max results (default: `20`)
- `--offset <number>` — Pagination offset (default: `0`)
- `--json` — Output as JSON

### deployments get

Retrieve a single deployment's details by ID.

```bash
mcloud deployments get <deployment-id> --organization <org-id> --project <project-id-or-handle> --json
```

**Arguments:**
- `deployment` — Deployment ID (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`, `--json`

### deployments build-logs

Fetch build logs for a deployment. Use this to debug `build-failed` status.

```bash
mcloud deployments build-logs <deployment-id> --organization <org-id> --project <project-id-or-handle>
```

**Arguments:**
- `deployment` — Deployment ID (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`
- `--type <backend|storefront>` — Which build log stream to read (default: `backend`)
- `--json` — Output as JSON

## Deployment Statuses

| Status | Meaning |
|--------|---------|
| `created` | Build not started yet |
| `building` | Build running |
| `built` | Build succeeded, awaiting rollout |
| `deploying` | Rolling out to environment |
| `deployed` | Live and serving traffic |
| `build-failed` | Build step failed — read `build-logs` |
| `deployment-failed` | Build succeeded, runtime crashed — read `mcloud logs` |
| `timed-out` | Exceeded time budget (backend only) |
| `canceled` | Superseded by a newer deployment |
| `idle` | No longer the active deployment |

## Examples

```bash
# List all deployments (with active context set)
mcloud deployments list --json

# Find most recent build-failed deployment
mcloud deployments list --json \
  | jq -r '[.[] | select(.backend_status == "build-failed")][0].id'

# Get deployment details
mcloud deployments get bld_01ABC123 --json

# Read backend build logs
mcloud deployments build-logs bld_01ABC123

# Read storefront build logs
mcloud deployments build-logs bld_01ABC123 --type storefront

# Filter deployments by commit SHA
mcloud deployments list --commit a1b2c3d --json | jq '.'

# Get deployments for a specific environment
mcloud deployments list --environment production --json
```
