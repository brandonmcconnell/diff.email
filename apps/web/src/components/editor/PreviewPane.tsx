"use client";
import { useComputedTheme } from "@/hooks/useComputedTheme";
import { bundle } from "@/lib/bundler";
import { cn } from "@/lib/utils";
import type { Client, Engine } from "@diff-email/shared";
import { Console } from "console-feed";
import { useEffect, useRef, useState } from "react";
import * as React from "react";

interface Props {
	html: string;
	/** Optional source files when editing JSX/TSX – key is file path */
	files?: Record<string, string>;
	/** Entry file path inside `files` (e.g. "index.tsx") */
	entry?: string;
	exportName?: string;
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

type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";
interface ConsoleMessage {
	id: string;
	method: ConsoleMethod;
	data: unknown[];
}

export function PreviewPane({
	html,
	files,
	entry,
	exportName = "default",
	mode,
	dark,
	showConsole = false,
	onLogsChange,
}: Props) {
	const { theme } = useComputedTheme();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<
		Array<{
			data: string[];
			method: "error" | "warn";
		}>
	>([]);

	// Keep a stable ref to the callback so effects don't need it in deps
	const onLogsChangeRef = useRef<typeof onLogsChange | undefined>(undefined);
	useEffect(() => {
		onLogsChangeRef.current = onLogsChange;
	}, [onLogsChange]);

	// Listen for console events
	useEffect(() => {
		function handleMessage(e: MessageEvent) {
			if (!e.data) return;
			if (e.data.type === "console") {
				setLogs((prev) => [
					...prev,
					{ method: e.data.method as "error" | "warn", data: e.data.args },
				]);
			} else if (e.data.type === "console_clear") {
				setLogs([]);
			}
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	// Notify parent on logs change
	useEffect(() => {
		onLogsChangeRef.current?.(logs);
	}, [logs]);

	// Resolve effective entry (default to index.tsx)
	const effectiveEntry = entry ?? "index.tsx";

	useEffect(() => {
		if (!iframeRef.current) return;

		// Screenshot placeholder unchanged
		if (mode !== "live") return;

		// If no module files or the entry is .html treat as raw HTML
		if (!files || !effectiveEntry || effectiveEntry.endsWith(".html")) {
			iframeRef.current.srcdoc = html;
			return;
		}

		// Validate entry exists in the provided virtual file map
		if (!files[effectiveEntry]) {
			setError(`Entry file "${effectiveEntry}" not found in project`);
			return;
		}

		// JSX/TSX email – bundle then inject
		(async () => {
			try {
				const js = await bundle(effectiveEntry, files);
				const blobUrl = URL.createObjectURL(
					new Blob([js], { type: "text/javascript" }),
				);

				const doc = `<!DOCTYPE html><html><body>
					<script>
						// Inform parent to clear previous logs
						window.parent.postMessage({type:'console_clear'}, '*');
						
						// Set up process.env before any module loads
						if (typeof process === 'undefined') {
							window.process = { env: { VERCEL_URL: 'localhost:3000', NODE_ENV: 'development' } };
						}

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
							const stack = e.error?.stack ? '\\n' + e.error.stack : '';
							window.parent.postMessage({
								type:'console',
								method:'error',
								args:[e.message + ' (' + info + ')' + stack]
							}, '*');
						});
						window.addEventListener('unhandledrejection', function(e){
							const msg = e.reason?.message || String(e.reason);
							const stack = e.reason?.stack ? '\\n' + e.reason.stack : '';
							window.parent.postMessage({
								type:'console',
								method:'error',
								args:[msg + stack]
							}, '*');
						});
					</script>
					<div id="root"></div>
					<script type="module">
						// First, let's debug the bundle content
						(async () => {
							try {
								// Fetch and analyze the bundle first
								const response = await fetch('${blobUrl}');
								const bundleContent = await response.text();
								
								// Split into lines for debugging
								const lines = bundleContent.split('\\n');
								console.log('Bundle has', lines.length, 'lines total');
								
								// Log lines around line 17 (where the error occurs)
								console.log('Lines around line 17:');
								for (let i = 14; i < 20 && i < lines.length; i++) {
									console.log(\`Line \${i + 1}: \${lines[i]}\`);
								}
								
								// Now proceed with the actual import
								console.log('Attempting to import bundle...');
								
								// Import React modules first
								const React = (await import('https://esm.sh/react@18')).default || (await import('https://esm.sh/react@18'));
								const ReactJSXRuntime = await import('https://esm.sh/react@18/jsx-runtime');
								
								// Import React Email components package
								const ReactEmailComponents = await import('https://esm.sh/@react-email/components@0.0.31');
								
								// Make everything available globally before importing the component
								window.React = React;
								window['react'] = React;
								window['react/jsx-runtime'] = ReactJSXRuntime;
								window['@react-email/components'] = ReactEmailComponents;
								
								// Also expose individual components
								Object.entries(ReactEmailComponents).forEach(([key, value]) => {
									window[key] = value;
								});

								// Now import the user's component
								console.log('Importing user component from blob...');
								const mod = await import('${blobUrl}');
								const Component = mod['${exportName}'] || mod.default;
								
								if (!Component) {
									throw new Error('No component found with export: ${exportName}');
								}
								
								console.log('Component loaded:', Component);

								// Use preview props if available
								const props = Component.PreviewProps || {};
								
								// Import the render function from React Email
								const { render } = await import('https://esm.sh/@react-email/render@1.0.1');
								
								// Create element and render with React Email's render function
								console.log('Creating element with props:', props);
								const element = React.createElement(Component, props);
								
								// Use React Email's render function
								console.log('Rendering with React Email render function...');
								const htmlOutput = await render(element, { pretty: true });
								
								console.log('Rendered HTML length:', htmlOutput.length);
								
								// Replace document with rendered HTML
								document.open();
								document.write(htmlOutput);
								document.close();
							} catch (err) {
								console.error('Preview error:', err);
								
								// If it's a syntax error, try to show more context
								if (err instanceof SyntaxError) {
									try {
										const response = await fetch('${blobUrl}');
										const bundleContent = await response.text();
										console.error('Bundle content preview (first 500 chars):', bundleContent.substring(0, 500));
									} catch (e) {
										console.error('Could not fetch bundle for debugging');
									}
								}
								
								const errorHtml = '<div style="padding: 20px; font-family: monospace;">' +
									'<h3 style="color: red;">Preview Error</h3>' +
									'<pre style="white-space: pre-wrap; color: #333;">' + 
									(err.stack || err.message || String(err)).replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
									'</pre></div>';
								document.body.innerHTML = errorHtml;
							}
						})();
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
				setLogs((prev) => [...prev, { method: "error", data: [msg] }]);
				if (iframeRef.current) {
					iframeRef.current.srcdoc = `<pre style="color:red;padding:1rem;white-space:pre-wrap">${msg}</pre>`;
				}
			}
		})();
	}, [html, files, effectiveEntry, mode, exportName]);

	// Convert internal logs to console-feed messages
	const consoleMessages: ConsoleMessage[] = logs.map(
		(l, idx) =>
			({
				id: String(idx),
				method: l.method as ConsoleMethod,
				data: l.data,
			}) as ConsoleMessage,
	);

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
				<div
					className={cn(
						// console-feed styles
						"h-40 overflow-y-auto border-t bg-muted font-medium",
						// console-feed global font styles
						"[&_*]:font-mono!",
						// size-4 for red circles in console-feed logs
						"[&_.css-ex0crf,&_.css-k2zzbo]:flex! [&_.css-ex0crf,&_.css-k2zzbo]:size-4!",
						"[&_.css-ex0crf,&_.css-k2zzbo]:items-center! [&_.css-ex0crf,&_.css-k2zzbo]:justify-center!",
						"[&_.css-ex0crf,&_.css-k2zzbo]:subpixel-antialiased! [&_.css-ex0crf,&_.css-k2zzbo]:leading-none!",
						"[&_.css-ex0crf,&_.css-k2zzbo]:font-medium!",
						// text styles for console-feed logs with numeric counts
						"[&_.css-ex0crf]:font-medium! [&_.css-ex0crf]:text-white! [&_.css-ex0crf]:text-xs!",
						// red circle with X in non-numeric console-feed logs
						"[&_.css-k2zzbo]:bg-[image:none]! [&_.css-k2zzbo]:[background:#dc2727]",
						"[&_.css-k2zzbo]:rounded-full! [&_.css-k2zzbo]:before:content-['×']!",
						"[&_.css-k2zzbo]:before:text-base! [&_.css-k2zzbo]:before:text-white!",
					)}
				>
					<Console logs={consoleMessages} variant={theme} />
				</div>
			)}
		</div>
	);
}
