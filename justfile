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

# Run the Next.js API server (apps/server) in dev mode (Turbopack)
dev:
	pnpm --filter server dev

# Build the production bundle for apps/server
build:
	pnpm --filter server build

# ------------------------------
# Database helpers (Drizzle)
# ------------------------------

db-generate:
	pnpm --filter server db:generate

db-migrate:
	pnpm --filter server db:migrate

# ------------------------------
# Screenshot-worker utilities (apps/worker)
# ------------------------------

# Launch the background worker locally (watches the BullMQ queue)
worker-dev:
	pnpm --filter worker dev

# Cache storageState for a single client / engine combo
# Example: `just cache-sessions gmail chromium -- --force`
cache-sessions client engine +flags?:
	pnpm --filter server exec tsx apps/server/src/app/api/screenshot-worker/cacheSessions.ts --client {{client}} --engine {{engine}} {{flags}}

# Cache all 15 client/engine combinations (prompts for each login)
# Example: `just cache-all-sessions -- --force --debug`
cache-all-sessions +flags?:
	pnpm --filter server exec tsx apps/server/src/app/api/screenshot-worker/cacheAllSessions.ts {{flags}}

# Clone the dev sessions to preview & prod prefixes
# Example: `just clone-sessions -- --force`
clone-sessions +flags?:
	pnpm --filter server exec tsx apps/server/src/app/api/screenshot-worker/cloneSessions.ts {{flags}} 