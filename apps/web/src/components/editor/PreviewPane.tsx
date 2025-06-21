"use client";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useComputedTheme } from "@/hooks/useComputedTheme";
import { bundle } from "@/lib/bundler";
// import { cn } from "@/lib/utils"; // removed unused helper
import type { Client, Engine } from "@diff-email/shared";
import { Console } from "console-feed";
import { useCallback, useEffect, useRef, useState } from "react";
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
									// Convert args to serializable format
									const serializableArgs = args.map(arg => {
										if (typeof arg === 'function') {
											return '[Function: ' + (arg.name || 'anonymous') + ']';
										} else if (typeof arg === 'object' && arg !== null) {
											try {
												// Try to stringify, but catch circular references
												JSON.stringify(arg);
												return arg;
											} catch (e) {
												return '[Object: ' + (arg.constructor?.name || 'Object') + ']';
											}
										}
										return arg;
									});
									window.parent.postMessage({type:'console', method:m, args: serializableArgs}, '*');
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
								const React = (await import('https://esm.sh/react@19')).default || (await import('https://esm.sh/react@19'));
								const ReactJSXRuntime = await import('https://esm.sh/react@19/jsx-runtime');
								
								// Import React Email components to ensure they're available
								console.log('Importing React Email components...');
								const ReactEmailComponents = await import('https://esm.sh/@react-email/components@0.1.0');
								
								// Make React and React Email components available globally before importing the component
								window.React = React;
								window['react'] = React;
								window['react/jsx-runtime'] = ReactJSXRuntime;
								
								// Make React Email components available globally
								window['@react-email/components'] = ReactEmailComponents;
								
								// Also expose individual components on the window
								for (const [key, value] of Object.entries(ReactEmailComponents)) {
									if (key !== 'default' && typeof value !== 'undefined') {
										window[key] = value;
									}
								}

								// Now import the user's component
								console.log('Importing user component from blob...');
								let mod;
								try {
									mod = await import('${blobUrl}');
									console.log('Module imported successfully');
								} catch (importErr) {
									console.error('Failed to import module:', importErr);
									throw importErr;
								}
								
								const Component = mod['${exportName}'] || mod.default;
								
								if (!Component) {
									console.error('Available exports:', Object.keys(mod));
									throw new Error('No component found with export: ${exportName}');
								}
								
								console.log('Component loaded:', typeof Component);

								// Use preview props if available
								const props = Component.PreviewProps || {};
								
								// Import ReactDOMServer for server-side rendering
								const ReactDOMServer = await import('https://esm.sh/react-dom@19/server');
								
								// Create element with the component
								console.log('Creating element with props:', props);
								
								// Get ReactDOMServer (may already be imported)
								console.log('Getting ReactDOMServer...');
								const ReactDOMServerModule = window.ReactDOMServer || await import('https://esm.sh/react-dom@19/server');
								window.ReactDOMServer = ReactDOMServerModule;
								
								// Create the element with the component and props
								console.log('Creating element with component and props...');
								const element = React.createElement(Component, props);
								
								// Debug what we're about to render
								console.log('Element type:', element.type);
								console.log('Element props keys:', element.props ? Object.keys(element.props) : 'no props');
								
								// Try to render with ReactDOMServer
								console.log('Rendering with ReactDOMServer...');
								let htmlOutput;
								
								try {
									// For React Email components, we need to handle them specially
									console.log('Attempting to render email component...');
									
									// Since React Email components don't work well in the browser,
									// we'll use a workaround by importing a browser-compatible version
									console.log('Loading browser-compatible React Email render...');
									
									// Try multiple approaches to render React Email components
									let rendered = false;
									
									// Approach 1: Try using the React Email render function
									try {
										const renderModule = await import('https://esm.sh/@react-email/render@1.1.2?target=es2020');
										console.log('Render module loaded');
										
										if (renderModule.render) {
											htmlOutput = await renderModule.render(element);
											rendered = true;
											console.log('Rendered with React Email render');
										}
									} catch (e) {
										console.log('React Email render not available:', e.message);
									}
									
									// Approach 2: Try calling the component directly and rendering the result
									if (!rendered) {
										try {
											console.log('Trying direct component call...');
											const componentResult = Component(props);
											
											// If it's a React element, try to render it
											if (componentResult && typeof componentResult === 'object' && componentResult.$$typeof) {
												// Use ReactDOMServer on the result
												htmlOutput = ReactDOMServerModule.renderToStaticMarkup(componentResult);
												rendered = true;
												console.log('Rendered component result with ReactDOMServer');
											}
										} catch (e) {
											console.log('Direct component call failed:', e.message);
										}
									}
									
									// Approach 3: Use ReactDOMServer on the createElement result
									if (!rendered) {
										console.log('Using ReactDOMServer on element...');
										htmlOutput = ReactDOMServerModule.renderToStaticMarkup(element);
									}
									
									console.log('Successfully rendered, HTML length:', htmlOutput.length);
								} catch (renderError) {
									console.error('Render error details:', {
										message: renderError.message,
										stack: renderError.stack,
										elementType: element?.type?.name || 'unknown',
										props: element?.props
									});
									throw renderError;
								}
								
								console.log('Rendered HTML length:', htmlOutput.length);
								// TODO: Remove this
								console.log('Testing console.log', [1, 2, 3], { a: [1, 2, 3], b: { a: 1, b: [1, 2, new Map([[{a:1}, 2]])] } });
								console.info('Testing console.info', [1, 2, 3], { a: [1, 2, 3], b: { a: 1, b: [1, 2, new Map([[{a:1}, 2]])] } });
								console.warn('Testing console.warn', [1, 2, 3], { a: [1, 2, 3], b: { a: 1, b: [1, 2, new Map([[{a:1}, 2]])] } });
								console.error('Testing console.error', [1, 2, 3], { a: [1, 2, 3], b: { a: 1, b: [1, 2, new Map([[{a:1}, 2]])] } });
								console.debug('Testing console.debug', [1, 2, 3], { a: [1, 2, 3], b: { a: 1, b: [1, 2, new Map([[{a:1}, 2]])] } });
								console.table([
									{
										id: 1,
										name: "Alice",
										age: 28,
										occupation: "Engineer",
										address: {
											city: "Seattle",
											state: "WA"
										}
									},
									{
										id: 2,
										name: "Bob",
										age: 34,
										occupation: "Designer",
										address: {
											city: "Portland",
											state: "OR"
										}
									},
									{
										id: 3,
										name: "Carol",
										age: 23,
										occupation: "Developer",
										address: {
											city: "San Francisco",
											state: "CA"
										}
									}
								]);
								
								// Wrap in proper HTML structure
								const fullHTML = '<!DOCTYPE html>' +
									'<html>' +
									'<head>' +
									'<meta charset="utf-8">' +
									'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
									'</head>' +
									'<body>' +
									htmlOutput +
									'</body>' +
									'</html>';
								
								// Replace document with rendered HTML
								document.open();
								document.write(fullHTML);
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

	/**
	 * Apply light / dark classes to the preview document only.
	 * This must not leak outside the iframe so we mutate the
	 * iframe's own documentElement. We also set the css
	 * `color-scheme` property so built-in form controls match.
	 */
	const applyDarkMode = useCallback(() => {
		const iframe = iframeRef.current;
		const doc = iframe?.contentDocument;
		if (!doc) return;

		const root = doc.documentElement;
		if (!root) return;

		if (dark) {
			root.classList.add("dark");
			// Ensure browser default styles respect dark mode.
			root.style.colorScheme = "dark";
		} else {
			root.classList.remove("dark");
			root.style.colorScheme = "light";
		}
	}, [dark]);

	// Re-apply dark mode whenever the toggle changes or the iframe reloads.
	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		// Apply immediately in case the iframe is already loaded.
		applyDarkMode();

		// Also apply after every load event (srcdoc updates / navigation).
		iframe.addEventListener("load", applyDarkMode);
		return () => {
			iframe.removeEventListener("load", applyDarkMode);
		};
	}, [applyDarkMode]);

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

	// Unified layout: preview always mounted; console + handle toggle visibility
	return (
		<ResizablePanelGroup direction="vertical" className="h-full w-full">
			{/* Preview panel */}
			<ResizablePanel defaultSize={75} minSize={25} className="min-h-[5rem]">
				<div className="relative h-full w-full">
					<iframe
						title="Preview"
						ref={iframeRef}
						className="h-full w-full border-0"
					/>
				</div>
			</ResizablePanel>

			{/* Divider / handle */}
			<ResizableHandle
				className={showConsole ? undefined : "pointer-events-none opacity-0"}
			/>

			{/* Console panel (collapsible) */}
			<ResizablePanel
				defaultSize={25}
				minSize={10}
				maxSize={75}
				className={showConsole ? "" : "hidden"}
			>
				<div className="console-feed h-full!">
					<Console logs={consoleMessages} variant={theme} />
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
