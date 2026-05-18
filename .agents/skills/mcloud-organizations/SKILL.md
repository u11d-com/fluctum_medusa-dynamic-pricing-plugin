---
name: mcloud-organizations
description: Execute mcloud organizations commands to list or get Cloud organizations. Use when discovering organizations, resolving organization IDs by name, or retrieving organization details including members and subscription.
allowed-tools: Bash(mcloud organizations*), Bash(mcloud use*), Bash(jq*)
---

# Cloud CLI: Organizations Commands

Execute `mcloud organizations` commands to list and retrieve Cloud organizations.

## Constraints

- `organizations list` requires **personal auth** (browser login or personal access key). Organization access keys return 401 on this command.
- When authenticated with `MCLOUD_TOKEN` using an org access key, use `mcloud whoami --json` to get the organization ID instead.

## Commands

### organizations list

List all organizations your account has access to.

```bash
mcloud organizations list --json
```

**Options:**
- `--json` — Output as JSON

### organizations get

Retrieve a single organization by ID. Returns metadata, subscription details, and members.

```bash
mcloud organizations get <organization-id> --json
```

**Arguments:**
- `organization` — Organization ID (required)

**Options:**
- `-o/--organization <id>` — Override the organization in active context (must match the argument)
- `--json` — Output as JSON

## Organization Fields (JSON)

| Field | Description |
|-------|-------------|
| `id` | Organization ID |
| `name` | Organization display name |
| `billing_email` | Billing contact email |
| `status` | `active` or otherwise |
| `members` | Array of member objects with `id`, `role`, `user.email` |
| `subscription` | Current plan, period, and `is_active` flag |
| `account_holder` | Billing account holder details |

## Examples

```bash
# List all organizations
mcloud organizations list --json

# Set context to first organization
ORGANIZATION_ID=$(
  mcloud organizations list --json \
    | jq -r '.[0].id'
)
mcloud use --organization "$ORGANIZATION_ID"

# Find organization ID by name
ORGANIZATION_ID=$(
  mcloud organizations list --json \
    | jq -r '.[] | select(.name == "My Organization") | .id'
)

# Get organization details (subscription, members)
mcloud organizations get org_123 --json

# List member emails
mcloud organizations get org_123 --json \
  | jq -r '.members[].user.email'

# Check subscription plan
mcloud organizations get org_123 --json \
  | jq '{plan: .subscription.plan.name, status: .subscription.is_active}'
```
