// Create new file
// Load remote type definitions from esm.sh and register them with Monaco.
import type * as Monaco from "monaco-editor";

const loaded = new Set<string>();

/**
 * Fetches and registers typings for a given bare module specifier using esm.sh.
 * If typings cannot be found, the promise resolves silently; errors are logged in dev.
 */
export async function loadRemoteTypes(
	monaco: typeof Monaco,
	specifier: string,
): Promise<void> {
	if (loaded.has(specifier)) return;
	loaded.add(specifier);

	try {
		const metaUrl = `https://esm.sh/${specifier}?meta`;
		const meta = await fetch(metaUrl).then((r) => (r.ok ? r.json() : null));
		if (!meta || !meta.types) return;
		const typesUrl = meta.types as string;
		const dts = await fetch(typesUrl).then((r) => (r.ok ? r.text() : ""));
		if (!dts) return;

		// Use virtual path under node_modules so module resolution works for sub-paths.
		const virtualPath = `file:///node_modules/${specifier}/index.d.ts`;
		monaco.languages.typescript.typescriptDefaults.addExtraLib(
			dts,
			virtualPath,
		);
	} catch (err) {
		if (process.env.NODE_ENV !== "production") {
			console.warn("[types-loader] Failed to load types for", specifier, err);
		}
	}
}
