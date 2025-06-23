"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useComputedTheme } from "@/hooks/useComputedTheme";
import { bundle } from "@/lib/bundler";
import { cn, pluralize } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
// import { cn } from "@/lib/utils"; // removed unused helper
import type { Client, Engine } from "@diff-email/shared";
import { Label } from "@radix-ui/react-label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Console, type Hook } from "console-feed";
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
			method: ConsoleMethod;
		}>,
	) => void;
	emailId: string;
	versionId: string;
}

export type ConsoleMethod = Parameters<Parameters<typeof Hook>[1]>[0]["method"];
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
	screenshotUrl,
	showConsole = false,
	onLogsChange,
	emailId,
	versionId,
}: Props) {
	const { theme } = useComputedTheme();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<
		Array<{
			data: string[];
			method: ConsoleMethod;
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
					{ method: e.data.method as ConsoleMethod, data: e.data.args },
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

	// Common constants for screenshot grid
	const clients: Client[] = ["gmail", "outlook", "yahoo", "aol", "icloud"];
	const engines: Engine[] = ["chromium", "firefox", "webkit"];
	const combos = clients.flatMap((cl) =>
		engines.map((en) => ({ client: cl, engine: en })),
	);

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

	// Screenshot generation dialog state
	const [runId, setRunId] = useState<string | null>(null);
	const { data: runData } = useQuery({
		...trpc.runs.get.queryOptions({ runId: runId as string }),
		enabled: !!runId,
		refetchInterval: 4_000,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	// Prepare mutation for sending test email & starting screenshot run.
	const sendTestAndRun = useMutation(
		trpc.emails.sendTestAndRun.mutationOptions(),
	);

	// Set of combos already completed in the current run (for disabling UI & pre-selecting)
	const completedSet = React.useMemo(
		() =>
			new Set(
				(
					runData?.screenshots as
						| { client: Client; engine: Engine }[]
						| undefined
				)?.map((s) => `${s.client}|${s.engine}`) ?? [],
			),
		[runData],
	);

	// Default full-selection set and state holding current selection
	const defaultSelected = React.useMemo(
		() => new Set(combos.map(({ client, engine }) => `${client}|${engine}`)),
		[combos],
	);
	const [selectedCombos, setSelectedCombos] =
		useState<Set<string>>(defaultSelected);

	// When dialog opens (or completed screenshots update), pre-select any combos that still need to run.
	useEffect(() => {
		if (!dialogOpen || mode !== "screenshot") return;

		const missing = combos.filter(
			({ client, engine }) => !completedSet.has(`${client}|${engine}`),
		);
		const nextSet = new Set<string>(
			missing.map(({ client, engine }) => `${client}|${engine}`),
		);

		// Only update if the preset differs – avoids clobbering user toggles.
		if (nextSet.size !== selectedCombos.size) {
			setSelectedCombos(nextSet);
			return;
		}
		for (const key of nextSet) {
			if (!selectedCombos.has(key)) {
				setSelectedCombos(nextSet);
				break;
			}
		}
		// Intentionally omit `selectedCombos` & `combos` so we don't reset on every click.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dialogOpen, mode, completedSet]);

	const pendingCount = selectedCombos.size;
	const quotaRemaining = 10;
	const hasUnlimitedPlan = quotaRemaining === Number.POSITIVE_INFINITY;

	const engineState = (eng: Engine): "all" | "none" | "some" => {
		let selected = 0;
		for (const cl of clients) {
			if (selectedCombos.has(`${cl}|${eng}`)) selected++;
		}
		if (selected === 0) return "none";
		if (selected === clients.length) return "all";
		return "some";
	};

	const toggleEngineGroup = (eng: Engine, newChecked: boolean | string) => {
		setSelectedCombos((prev) => {
			const next = new Set(prev);
			for (const cl of clients) {
				const key = `${cl}|${eng}`;
				if (newChecked) {
					next.add(key);
				} else {
					next.delete(key);
				}
			}
			return next;
		});
	};

	// Add handler function after toggleEngineGroup
	const setEngineValues = (eng: Engine, values: string[]) => {
		setSelectedCombos((prev) => {
			const next = new Set(prev);
			// remove all combos for this engine
			for (const cl of clients) next.delete(`${cl}|${eng}`);
			// add back selected values
			for (const v of values) next.add(v);
			return next;
		});
	};

	// screenshot type helper
	type Shot = { client: Client; engine: Engine; url: string };

	if (mode === "screenshot") {
		// Static list of 5×3 = 15 client/engine combos (placeholder phase)
		const clientLabels: Record<Client, string> = {
			gmail: "Gmail",
			outlook: "Outlook",
			yahoo: "Yahoo",
			aol: "AOL",
			icloud: "iCloud",
		};
		const engineLabels: Record<Engine, string> = {
			chromium: "Chrome",
			firefox: "Firefox",
			webkit: "Safari",
		};

		const notStarted = !screenshotUrl; // crude detection for now

		return (
			<div className="relative h-full w-full overflow-auto p-4">
				<div className={notStarted ? "opacity-100" : undefined}>
					<div className="grid auto-rows-[200px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
						{combos.map(({ client, engine }) => {
							return (
								<div
									key={`${client}|${engine}`}
									className="relative overflow-hidden rounded-lg border bg-card shadow-sm"
								>
									{(() => {
										const shot = (
											runData?.screenshots as Shot[] | undefined
										)?.find((s) => s.client === client && s.engine === engine);
										if (shot) {
											return (
												<img
													src={shot.url}
													alt="screenshot"
													className="absolute inset-0 h-full w-full object-cover"
												/>
											);
										}
										return (
											<div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
										);
									})()}
									<div className="absolute inset-x-0.75 bottom-0.75 rounded-md bg-linear-to-r from-background to-background/50 px-2.5 py-1.5 font-medium text-foreground text-xs backdrop-blur-sm">
										<span className="font-semibold">
											{clientLabels[client]}
										</span>
										<span className="mx-1 select-none opacity-50">•</span>
										<span>{engineLabels[engine]}</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{notStarted && (
					<div className="pointer-events-none sticky bottom-0 flex items-end justify-center p-6">
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button
									className="pointer-events-auto rounded-full shadow-foreground/25 shadow-xl"
									size="lg"
								>
									Generate screenshots
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-lg">
								<DialogHeader>
									<DialogTitle>Generate screenshots</DialogTitle>
									<DialogDescription>
										Select the clients and engines you want to use for the
										screenshots.
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4 py-2">
									{engines.map((eng) => {
										const state = engineState(eng);
										const groupChecked =
											state === "all"
												? true
												: state === "none"
													? false
													: "indeterminate";
										return (
											<div key={eng} className="space-y-2">
												<Label className="inline-flex cursor-pointer items-center gap-2">
													<Checkbox
														checked={groupChecked}
														onCheckedChange={(val) =>
															toggleEngineGroup(eng, !!val)
														}
													/>
													<span className="font-medium text-sm">
														{engineLabels[eng]}
													</span>
												</Label>
												<ToggleGroup
													type="multiple"
													className={cn(
														"grid w-full grid-cols-3 grid-rows-2 gap-2",
														"*:rounded-md! md:flex",
													)}
													value={clients
														.filter((cl) => selectedCombos.has(`${cl}|${eng}`))
														.map((cl) => `${cl}|${eng}`)}
													onValueChange={(vals) =>
														setEngineValues(eng, vals as string[])
													}
												>
													{clients.map((cl) => {
														const comboKey = `${cl}|${eng}`;
														const selected = selectedCombos.has(comboKey);
														const alreadyShot = completedSet.has(comboKey);
														return (
															<ToggleGroupItem
																key={comboKey}
																value={comboKey}
																disabled={alreadyShot}
																className={cn(
																	"border border-transparent!",
																	alreadyShot || selected
																		? "bg-emerald-500/25! text-emerald-800! dark:text-emerald-400!"
																		: "not-hover:border-foreground/15! bg-transparent text-foreground",
																	alreadyShot && "opacity-35",
																)}
															>
																{clientLabels[cl]}
															</ToggleGroupItem>
														);
													})}
												</ToggleGroup>
											</div>
										);
									})}

									<div className="pt-4">
										<p className="mb-1 text-sm">
											This run will use <strong>{pendingCount}</strong>{" "}
											{pluralize(pendingCount, "screenshot")}.
										</p>
										<Progress
											value={
												((quotaRemaining - pendingCount) / quotaRemaining) * 100
											}
										/>
										<p
											className={cn(
												"mt-1.5 font-medium text-muted-foreground text-xs",
												pendingCount > quotaRemaining && "text-destructive",
											)}
										>
											{hasUnlimitedPlan ? (
												<span>
													You are on the beta{" "}
													<span className="font-bold">unlimited plan</span>.
													Enjoy!
												</span>
											) : (
												<>
													<span className="font-bold">
														{quotaRemaining - pendingCount}
													</span>{" "}
													of <span className="font-bold">{quotaRemaining}</span>{" "}
													remaining this month
												</>
											)}
										</p>
									</div>
								</div>

								<DialogFooter className="pt-2">
									<Button
										disabled={
											pendingCount === 0 || pendingCount > quotaRemaining
										}
										onClick={async () => {
											const result = await sendTestAndRun.mutateAsync({
												emailId,
												versionId,
												clients: [...selectedCombos].map((k) => {
													const [client, engine] = k.split("|") as [
														Client,
														Engine,
													];
													return { client, engine };
												}),
												dark,
											});
											setRunId(result.runId);
											setDialogOpen(false);
										}}
									>
										Run now
									</Button>
									<Button
										variant="secondary"
										onClick={() => setDialogOpen(false)}
									>
										Cancel
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				)}
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
				className={showConsole ? undefined : "pointer-events-none"}
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
