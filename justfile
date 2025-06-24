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
	if [[ "{{target}}" == "server" ]]; then
		pnpm --filter server dev
	elif [[ "{{target}}" == "web" ]]; then
		pnpm --filter web dev
	else
		echo "Unknown target '{{target}}'. Use 'server' or 'web'." >&2
		exit 1
	fi

# Build a package: `just build server` or `just build web`
build target:
	if [[ "{{target}}" == "server" ]]; then
		pnpm --filter server build
	elif [[ "{{target}}" == "web" ]]; then
		pnpm --filter web build
	else
		echo "Unknown target '{{target}}'. Use 'server' or 'web'." >&2
		exit 1
	fi

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

# Launch the screenshot worker listener locally (watches the BullMQ queue)
worker-dev:
	# Runs the same code path Vercel executes for the background function
	# Requires env vars (Redis, Blob tokens, etc.) to be set in the shell
	pnpm --filter server run worker:dev

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