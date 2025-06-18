"use client";
import { bundle } from "@/lib/bundler";
import type { Client, Engine } from "@diff-email/shared";
import { useEffect, useRef, useState } from "react";

interface Props {
	html: string;
	/** Optional source files when editing JSX/TSX – key is file path */
	files?: Record<string, string>;
	/** Entry file path inside `files` (e.g. "index.tsx") */
	entry?: string;
	engine: Engine;
	client: Client;
	mode: "live" | "screenshot";
	dark: boolean;
	screenshotUrl?: string;
}

export function PreviewPane({ html, files, entry, mode, dark }: Props) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!iframeRef.current) return;

		// Screenshot placeholder unchanged
		if (mode !== "live") return;

		// If no module files or the entry is .html treat as raw HTML
		if (!files || !entry || entry.endsWith(".html")) {
			iframeRef.current.srcdoc = html;
			return;
		}

		// JSX/TSX email – validate entry exists
		const indexCandidates = ["index.tsx", "index.jsx", "index.ts", "index.js"];
		const indexCount = indexCandidates.filter((f) => files[f]).length;
		if (indexCount === 0) {
			setError("Missing index.* file with default export");
			return;
		}
		if (indexCount > 1) {
			setError(
				"Multiple index.* files found. Exactly one index.* file (js/ts/jsx/tsx) with a default export is required.",
			);
			return;
		}

		// JSX/TSX email – bundle then inject
		(async () => {
			try {
				const js = await bundle(entry, files);
				// Create a blob URL for the bundle so we can import it
				const blobUrl = URL.createObjectURL(
					new Blob([js], { type: "text/javascript" }),
				);
				const doc = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" /></head><body${
					dark ? ' class="dark"' : ""
				}><div id=\"root\"></div>
				<script type="module">
				import React from 'https://esm.sh/react@18';
				import ReactDOM from 'https://esm.sh/react-dom@18/client';
				(async () => {
					const mod = await import('${blobUrl}');
					const App = mod.default ?? mod;
					if(!App){
						document.body.innerHTML = '<pre style="color:red">index file must have a default export</pre>';
						return;
					}
					const root = ReactDOM.createRoot(document.getElementById('root'));
					root.render(React.createElement(App));
				})();
				</script></body></html>`;
				if (iframeRef.current) {
					iframeRef.current.srcdoc = doc;
					// Revoke URL when iframe reloads next time
					setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
					setError(null);
				}
			} catch (err: unknown) {
				console.error(err);
				setError((err as Error).message ?? String(err));
				if (iframeRef.current) {
					iframeRef.current.srcdoc = `<pre style="color:red;padding:1rem;white-space:pre-wrap">${
						(err as Error).message ?? String(err)
					}</pre>`;
				}
			}
		})();
	}, [html, files, entry, mode, dark]);

	if (mode === "screenshot") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted">
				<p className="text-muted-foreground text-sm">Screenshots TBD…</p>
			</div>
		);
	}

	return (
		<iframe
			title="Preview"
			ref={iframeRef}
			className="h-full w-full border-0"
		/>
	);
}
