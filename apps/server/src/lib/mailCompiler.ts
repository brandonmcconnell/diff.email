import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { render } from "@react-email/render";
import type { Loader, OnResolveArgs, Plugin, PluginBuild } from "esbuild";
import * as esbuild from "esbuild";
import * as React from "react";

/**
 * Compile a multi-file React Email project (TS/JSX) into HTML.
 * Used on the server as a fallback when a Version row has files but no pre-rendered HTML.
 *
 * @param files      virtual FS map  path → contents
 * @param entryPath  entry file path inside `files` (default "index.tsx")
 * @param exportName export to use from the module (default "default")
 */
export async function compileEmailToHtml(
	files: Record<string, string>,
	entryPath = "index.tsx",
	exportName = "default",
): Promise<string> {
	// Build the code into a single ESM bundle in memory.
	const inMemPlugin: Plugin = {
		name: "in-memory-files",
		setup(build: PluginBuild) {
			// Bare package redirects
			const externals = new Map([
				["react", "react"],
				["react/jsx-runtime", "react/jsx-runtime"],
				["react-dom", "react-dom"],
			]);
			for (const [pkg] of externals) {
				build.onResolve({ filter: new RegExp(`^${pkg}$`) }, () => ({
					path: pkg,
					external: true,
				}));
			}

			// React Email packages fetched from esm.sh
			build.onResolve({ filter: /^@react-email\// }, (args: OnResolveArgs) => ({
				path: `https://esm.sh/${args.path}`,
				external: true,
			}));

			// Handle user imports
			build.onResolve(
				{ filter: /.*/ },
				({ path: importPath, importer, resolveDir }: OnResolveArgs) => {
					// entry file
					if (!importer) {
						return {
							path: importPath,
							namespace: "mem",
							pluginData: { dir: "/" },
						};
					}
					// Bare identifier (node module) – treat as external (esm.sh will resolve at runtime if needed)
					if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
						return { path: `https://esm.sh/${importPath}`, external: true };
					}
					// Relative path within virtual fs
					const baseDir = resolveDir || "/";
					const normalized = new URL(
						importPath,
						`file://${baseDir}/`,
					).pathname.slice(1);
					return { path: normalized, namespace: "mem" };
				},
			);

			// Load file contents
			build.onLoad(
				{ filter: /.*/, namespace: "mem" },
				({ path: filePath }: esbuild.OnLoadArgs) => {
					const contents = files[filePath];
					if (contents == null) return null;
					const ext = filePath.split(".").pop()?.toLowerCase();
					const loader: Loader =
						ext === "ts"
							? "ts"
							: ext === "tsx"
								? "tsx"
								: ext === "jsx"
									? "jsx"
									: "js";
					return {
						contents,
						loader,
						resolveDir: "/",
					};
				},
			);
		},
	};

	const result = await esbuild.build({
		entryPoints: [entryPath],
		bundle: true,
		write: false,
		format: "esm",
		platform: "node",
		target: "es2020",
		plugins: [inMemPlugin],
		jsx: "automatic",
		logLevel: "error",
	});

	const code = result.outputFiles[0].text;

	// Persist to temporary file so we can import it.
	const tmpFile = path.join(os.tmpdir(), `email-${randomUUID()}.mjs`);
	await fs.writeFile(tmpFile, code, "utf8");

	try {
		const mod = await import(`file://${tmpFile}`);
		const Component: React.ComponentType<any> | undefined =
			mod[exportName] ?? mod.default;
		if (!Component) throw new Error(`Export \"${exportName}\" not found`);
		const props = (Component as any).PreviewProps ?? {};
		const element = React.createElement(Component, props);
		const html = render(element);
		return html;
	} finally {
		// Clean up temp file quietly
		fs.unlink(tmpFile).catch(() => {});
	}
}
