---
name: mcloud-variables
description: Execute mcloud variables commands to list and get environment variables for a Cloud environment. Use when inspecting, reading, or exporting environment variables. Never pass --reveal unless the user explicitly requests secret values.
allowed-tools: Bash(mcloud variables*), Bash(jq*)
---

# Cloud CLI: Variables Commands

Execute `mcloud variables` commands to inspect environment variables for Cloud environments.

## Constraints

- **Never pass `--reveal` unless the user explicitly asks.** Secret values appear in terminal scrollback, log aggregators, and process listings.
- Looking up by key requires `--project` and `--environment` (or the equivalent in active context). Looking up by ID (`var_...`) works without project/environment context.

## Commands

### variables list

List all environment variables for a Cloud environment.

```bash
mcloud variables list \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --environment <environment-handle> \
  --json
```

**Options:**
- `-o/--organization <id>` — Organization ID (falls back to active context)
- `-p/--project <id-or-handle>` — Project ID or handle (falls back to active context)
- `-e/--environment <handle>` — Environment handle (falls back to active context)
- `--reveal` — Print secret values in plaintext instead of masking (**use only when explicitly asked**)
- `--limit <1-500>` — Max results (default: `200`)
- `--offset <number>` — Pagination offset (default: `0`)
- `--json` — Output as JSON

### variables get

Retrieve a single variable by its ID (`var_...`) or key.

```bash
# By key (requires project + environment context)
mcloud variables get ADMIN_CORS \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --environment <environment-handle> \
  --json

# By ID (works without project/environment context)
mcloud variables get var_01XYZ --json
```

**Arguments:**
- `variable` — Variable ID (`var_...`) or key (required)

**Options:**
- `-o/--organization <id>`, `-p/--project <id-or-handle>`, `-e/--environment <handle>`
- `--reveal` — Print secret value in plaintext (**use only when explicitly asked**)
- `--json` — Output as JSON

## Variable Fields (JSON)

| Field | Description |
|-------|-------------|
| `id` | Variable ID (`var_...`) |
| `key` | Variable name (e.g. `ADMIN_CORS`) |
| `value` | Variable value (masked if `is_secret` and `--reveal` not passed) |
| `is_secret` | Whether the variable is treated as a secret |
| `is_build` | Available at build time |
| `is_runtime` | Available at runtime |
| `entity_id` | The environment ID this variable belongs to |

## Examples

```bash
# List all variables for the active environment
mcloud variables list --json

# Get a variable by key (with active context)
mcloud variables get DATABASE_URL --json

# Get a variable by ID (no env context needed)
mcloud variables get var_01XYZ --json

# Only reveal secrets when user explicitly asks
mcloud variables get STRIPE_SECRET_KEY --reveal --json | jq -r '.value'

# Export all variables to a .env file (user must explicitly request --reveal)
mcloud variables list --reveal --json \
  | jq -r '.[] | "\(.key)=\(.value)"' \
  > .env

# List only runtime variables
mcloud variables list --json | jq '[.[] | select(.is_runtime == true)]'

# Check if a specific variable exists
mcloud variables list --json | jq '.[] | select(.key == "REDIS_URL")'
```
