---
name: mcloud-projects
description: Execute mcloud projects commands to list, get, or delete Cloud projects. Use when discovering projects, resolving project handles by name, or retrieving project details including linked environments.
allowed-tools: Bash(mcloud projects*), Bash(mcloud use*), Bash(jq*)
---

# Cloud CLI: Projects Commands

Execute `mcloud projects` commands to manage Cloud projects.

## Constraints

- `projects delete` is **irreversible** — removes all associated environments, deployments, and resources. Always confirm the project ID/handle before deleting.
- Use `--yes` with `delete` in non-interactive contexts (scripts, pipelines, agents).

## Commands

### projects list

List all projects in an organization.

```bash
mcloud projects list --organization <org-id> --json
```

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context; **required**)
- `--json` — Output as JSON

### projects get

Retrieve a single project by its ID or handle.

```bash
mcloud projects get <project-id-or-handle> --organization <org-id> --json
```

**Arguments:**
- `project` — Project ID or handle (required)

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context; **required**)
- `--json` — Output as JSON

### projects delete

Delete a project by its ID or handle. **Irreversible.**

```bash
mcloud projects delete <project-id-or-handle> \
  --organization <org-id> \
  --yes
```

**Arguments:**
- `project` — Project ID or handle (required)

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context; **required**)
- `-y/--yes` — Skip confirmation prompt (required in non-interactive mode)
- `--json` — Output as JSON

## Project Fields (JSON)

| Field | Description |
|-------|-------------|
| `id` | Project ID |
| `handle` | URL-safe project handle (used in most commands) |
| `name` | Display name |
| `status` | `ready` when healthy |
| `region` | Deployment region (e.g. `us-east-1`) |
| `repository` | Linked GitHub repository (`owner/repo`) |
| `root_path` | Root path within the repository |
| `environments` | Array of associated environments |

## Examples

```bash
# List all projects in an organization
mcloud projects list --organization org_123 --json

# Set context to a project by name
PROJECT_HANDLE=$(
  mcloud projects list --organization org_123 --json \
    | jq -r '.[] | select(.name == "My Store") | .handle'
)
mcloud use --project "$PROJECT_HANDLE"

# Get project details including environments
mcloud projects get my-store --organization org_123 --json

# List all environment handles for a project
mcloud projects get my-store --organization org_123 --json \
  | jq -r '.environments[].handle'

# Find project handle by name
mcloud projects list --organization org_123 --json \
  | jq -r '.[] | select(.name == "My Store") | .handle'

# Delete a project (irreversible — confirm before running)
mcloud projects delete old-project --organization org_123 --yes
```
