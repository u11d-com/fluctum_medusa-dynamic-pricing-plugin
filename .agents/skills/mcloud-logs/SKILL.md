---
name: mcloud-logs
description: Execute mcloud logs to fetch and stream runtime logs for Cloud environments. Use when reading backend or storefront logs, filtering by time range, searching for errors, or scoping logs to a specific deployment.
allowed-tools: Bash(mcloud logs*), Bash(jq*)
---

# Cloud CLI: Logs Command

Execute `mcloud logs` to fetch runtime logs for a Cloud environment's backend or storefront.

## Constraints

- `--follow` and `--json` are incompatible. For programmatic log analysis, use bounded time windows with `--from`/`--to` and `--json`.
- `--follow` streams until interrupted with `Ctrl+C` — do not use in scripts or pipelines.
- Default retrieves the last 500 log lines from the past 15 minutes.

## Command

```bash
mcloud logs \
  --organization <org-id> \
  --project <project-id-or-handle> \
  --environment <environment-handle> \
  [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o/--organization <id>` | Organization ID | Active context |
| `-p/--project <id-or-handle>` | Project ID or handle | Active context |
| `-e/--environment <handle>` | Environment handle | Active context |
| `-f/--follow` | Stream logs continuously (incompatible with `--json`) | `false` |
| `--limit <1-5000>` | Max log lines (non-follow mode only) | `500` |
| `--from <ISO8601>` | Start of time range (e.g. `2026-04-22T10:00:00Z`) | 15 minutes ago |
| `--to <ISO8601>` | End of time range; if >15 min ago, must also pass `--from` | now |
| `--search <string>` | Filter by substring (same as dashboard search bar) | — |
| `--deployment <id>` | Filter by deployment or build ID | — |
| `--source <string>` | Filter by source (repeatable) | — |
| `--metadata <key=value>` | Filter by metadata field (repeatable; same key merges values) | — |
| `--type <backend\|storefront>` | Log stream to query | `backend` |
| `--json` | Output as JSON (incompatible with `--follow`) | `false` |

## Examples

```bash
# Basic log fetch (last 500 lines, last 15 min)
mcloud logs --json

# Search for errors
mcloud logs --search error --limit 1000 --json

# Filter for HTTP 500 errors via metadata
mcloud logs --metadata status=500 --limit 1000 --json

# Logs for a specific deployment (build or deployment ID)
mcloud logs --deployment bld_01ABC123 --json

# Structured output for agent analysis
mcloud logs --search error --json | jq '.[] | {timestamp, source, message}'

# Storefront logs
mcloud logs --type storefront --json

# Stream live logs (human-readable, not for scripts)
mcloud logs --follow

# Logs within a specific time range
mcloud logs --from 2026-04-22T10:00:00Z --to 2026-04-22T11:00:00Z --limit 1000 --json

# Logs from a time until now
mcloud logs --from 2026-04-22T10:00:00Z --json

# Multiple source filters
mcloud logs --source api --source worker --json

# Multiple metadata filters (HTTP 4xx and 5xx)
mcloud logs --metadata status=400 --metadata status=500 --limit 500 --json
```

## Time Range Notes

- Default window is the past 15 minutes.
- Pass `--from` without `--to` to fetch from a time until now.
- Pass `--to` without `--from` only if `--to` is within the last 15 minutes; otherwise also pass `--from`.
- Both `--from` and `--to` accept ISO 8601 timestamps.
