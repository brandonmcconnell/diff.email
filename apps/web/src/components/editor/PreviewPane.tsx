"use client";
import { bundle } from "@/lib/bundler";
import type { Client, Engine } from "@diff-email/shared";
import { Console } from "console-feed";
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
	showConsole?: boolean;
	onLogsChange?: (
		logs: Array<{
			data: string[];
			method: "error" | "warn";
		}>,
	) => void;
}

export function PreviewPane({
	html,
	files,
	entry,
	mode,
	dark,
	showConsole = false,
	onLogsChange,
}: Props) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<
		Array<{
			data: string[];
			method: "error" | "warn";
		}>
	>([]);

	// Listen for console events from iframe
	useEffect(() => {
		function handleMessage(e: MessageEvent) {
			if (!e.data) return;
			if (e.data.type === "console") {
				setLogs((prev) => {
					const next = [...prev, { method: e.data.method, data: e.data.args }];
					onLogsChange?.(next);
					return next;
				});
			} else if (e.data.type === "console_clear") {
				setLogs([]);
				onLogsChange?.([]);
			}
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [onLogsChange]);

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
				const blobUrl = URL.createObjectURL(
					new Blob([js], { type: "text/javascript" }),
				);

				const doc = `<!DOCTYPE html><html><body>
					<script>
						// Inform parent to clear previous logs
						window.parent.postMessage({type:'console_clear'}, '*');
						(function(){
							const METHODS=['log','info','warn','error','debug'];
							METHODS.forEach((m)=>{
								const orig = console[m];
								console[m] = function(...args){
									window.parent.postMessage({type:'console', method:m, args}, '*');
									orig.apply(console, args);
								};
							});
						})();

						window.addEventListener('error', function(e){
							const info = e.filename + ':' + e.lineno + ':' + e.colno;
							const stack = e.error?.stack ? '\n' + e.error.stack : '';
							window.parent.postMessage({
								type:'console',
								method:'error',
								args:[e.message + ' (' + info + ')' + stack]
							}, '*');
						});
						window.addEventListener('unhandledrejection', function(e){
							const msg = e.reason?.message || String(e.reason);
							const stack = e.reason?.stack ? '\n' + e.reason.stack : '';
							window.parent.postMessage({
								type:'console',
								method:'error',
								args:[msg + stack]
							}, '*');
						});
					</script>
					<div id="root"></div>
					<script type="module">
						import React from 'https://esm.sh/react@18';
						import * as ReactJsx from 'https://esm.sh/react@18/jsx-runtime';
						import * as ReactDOMClient from 'https://esm.sh/react-dom@18/client';

						// make jsx-runtime available globally so the next dynamic import resolves it
						window["react/jsx-runtime"] = ReactJsx;

						(async () => {
							const mod  = await import('${blobUrl}');
							const App  = mod.default ?? mod;
							const root = ReactDOMClient.createRoot(document.getElementById('root'));
							root.render(React.createElement(App));
						})().catch(err => {
							document.body.innerHTML = '<pre style="color:red;padding:1rem">'+err+'</pre>';
						});
					</script>
				</body></html>`;
				if (iframeRef.current) {
					iframeRef.current.srcdoc = doc;
					// Revoke URL when iframe reloads next time
					setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
					setError(null);
				}
			} catch (err: unknown) {
				const msg = (err as Error).message ?? String(err);
				console.error(err);
				setError(msg);
				setLogs((prev) => {
					const next = [...prev, { method: "error", data: [msg] }];
					onLogsChange?.(next);
					return next;
				});
				if (iframeRef.current) {
					iframeRef.current.srcdoc = `<pre style="color:red;padding:1rem;white-space:pre-wrap">${msg}</pre>`;
				}
			}
		})();
	}, [html, files, entry, mode, onLogsChange]);

	if (mode === "screenshot") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted">
				<p className="text-muted-foreground text-sm">Screenshots TBD…</p>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col">
			<div className="relative flex-1">
				<iframe
					title="Preview"
					ref={iframeRef}
					className="h-full w-full border-0"
				/>
			</div>
			{showConsole && (
				<div className="h-40 overflow-y-auto border-t bg-[#242424]">
					<Console logs={logs} variant="dark" />
				</div>
			)}
		</div>
	);
}
