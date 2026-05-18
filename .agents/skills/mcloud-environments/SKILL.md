---
name: mcloud-environments
description: Execute mcloud environments commands to list, get, create, delete, redeploy, or trigger builds for Cloud environments. Use when managing environment lifecycle, redeploying after variable changes, or starting new builds from source.
allowed-tools: Bash(mcloud environments*), Bash(mcloud use*), Bash(jq*)
---

# Cloud CLI: Environments Commands

Execute `mcloud environments` commands to manage environment lifecycle and deployments.

## Constraints

- **Production environments cannot be deleted.** Always check `type` via `environments get --json` before attempting delete in automation.
- Use `--yes` for destructive operations (`delete`) in non-interactive contexts.
- `redeploy` vs `trigger-build` are not interchangeable — choose the right one based on where the fix is.

## Commands

### environments list

List all environments in a project.

```bash
mcloud environments list --organization <org-id> --project <project-id-or-handle> --json
```

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context)
- `-p/--project <id-or-handle>` — Project ID or handle (falls back to active context)
- `--json` — Output as JSON

### environments get

Retrieve a single environment by handle.

```bash
mcloud environments get <environment-handle> --organization <org-id> --project <project-id-or-handle> --json
```

**Arguments:**
- `environment` — Environment handle (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`, `--json`

### environments create

Create a new long-lived environment.

```bash
mcloud environments create \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --name "Staging" \
  --branch develop \
  --json
```

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`
- `-n/--name <name>` — Environment name (required)
- `-b/--branch <branch>` — Git branch to track (required)
- `--custom-subdomain <subdomain>` — Optional custom subdomain
- `--json` — Output as JSON

### environments delete

Delete an environment. **Cannot delete production environments.**

```bash
mcloud environments delete <environment-handle> \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --yes
```

**Arguments:**
- `environment` — Environment handle (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`
- `-y/--yes` — Skip confirmation prompt (required in non-interactive mode)
- `--json` — Output as JSON

### environments redeploy

Re-run an existing build for the active deployment. Use when the fix is environment-side (variable change, infra issue) — does NOT start a new build.

```bash
mcloud environments redeploy <environment-handle> \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --json
```

**Arguments:**
- `environment` — Environment handle (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`, `--json`

> Requires the environment to have an active deployment. If it doesn't, use `trigger-build` first.

### environments trigger-build

Start a new build from the tracked branch. Use when the fix is committed code — creates a new deployment.

```bash
mcloud environments trigger-build <environment-handle> \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --json
```

**Arguments:**
- `environment` — Environment handle (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`, `--json`

## Redeploy vs Trigger-Build Decision

| Command | When to use |
|---------|-------------|
| `redeploy` | Fix is environment-side (variable change, infra config) — reruns existing build |
| `trigger-build` | Fix is in source code on the tracked branch — starts a new build |

## Examples

```bash
# List all environments
mcloud environments list --json

# Get environment details and check type before deleting
mcloud environments get staging --json | jq '{id, name, type, status}'

# Create a new environment tracking the develop branch
mcloud environments create --name "Staging" --branch develop --json

# Delete a non-production environment
mcloud environments delete staging --yes

# Redeploy after a variable change
mcloud environments redeploy production --json

# Trigger a fresh build from source
mcloud environments trigger-build production --json

# Find environment handles by name
mcloud environments list --json \
  | jq -r '.[] | select(.name == "Production") | .handle'

# Verify new build started
mcloud deployments list --environment production --limit 5 --json \
  | jq '.[] | {id, backend_status, updated_at}'
```
