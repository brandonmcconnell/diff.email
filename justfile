# justfile — monorepo-wide command runner shortcuts
# Usage: `just <recipe>`
# List available recipes: `just -l`

# Use bash with strict mode for every recipe
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# ------------------------------
# General
# ------------------------------

default:
	@just -l

# Run dev server for a package: `just dev server` or `just dev web`
dev target:
	case "{{target}}" in server) pnpm --filter server run dev ;; web) pnpm --filter web run dev ;; *) echo "Unknown target '{{target}}'. Use 'server' or 'web'." >&2; exit 1 ;; esac

# Build a package: `just build server` or `just build web`
build target:
	case "{{target}}" in server) pnpm --filter server run build ;; web) pnpm --filter web run build ;; *) echo "Unknown target '{{target}}'. Use 'server' or 'web'." >&2; exit 1 ;; esac

# ------------------------------
# Database helpers (Drizzle)
# ------------------------------

db-generate:
	pnpm --filter server run db:generate

db-migrate:
	pnpm --filter server run db:migrate

# ------------------------------
# Screenshot-worker utilities (apps/worker)
# ------------------------------

# Launch the screenshot worker listener locally (watches the BullMQ queue)
worker-dev:
	# Runs the same code path Vercel executes for the background function
	# Requires env vars (Redis, Blob tokens, etc.) to be set in the shell
	pnpm --filter server run worker:dev

# Cache storageState for a single client / engine combo
# Example: `just cache-sessions gmail chromium -- --force`
cache-sessions client engine *flags:
	pnpm --filter server exec tsx src/app/api/screenshot-worker/cacheSessions.ts --client {{client}} --engine {{engine}} {{flags}}

# Cache all 15 client/engine combinations (prompts for each login)
# Example: `just cache-all-sessions -- --force --debug`
cache-all-sessions *flags:
	pnpm --filter server exec tsx src/app/api/screenshot-worker/cacheAllSessions.ts {{flags}}

# Clone the dev sessions to preview & prod prefixes
# Example: `just clone-sessions -- --force`
clone-sessions *flags:
	pnpm --filter server exec tsx src/app/api/screenshot-worker/cloneSessions.ts {{flags}}

# Verify that each stored session JSON still logs in headlessly.
# Usage examples:
#   just verify-sessions              # check all combos
#   just verify-sessions --client gmail --engine chromium
# Any additional args are forwarded to the TS script.
verify-sessions *FLAGS:
	pnpm --filter server exec tsx src/app/api/screenshot-worker/verifySessions.ts {{FLAGS}} 