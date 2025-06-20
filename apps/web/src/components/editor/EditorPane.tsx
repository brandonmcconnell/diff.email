"use client";
import type { FileNode } from "@/components/tree-view";
import { useComputedTheme } from "@/hooks/useComputedTheme";
import { loadRemoteTypes } from "@/lib/loadRemoteTypes";
import { cn } from "@/lib/utils";
import { PanelLeftOpen } from "lucide-react";
import type * as Monaco from "monaco-editor";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import React from "react";
import { FileExplorer } from "./FileExplorer";

interface Props {
	value: string;
	onChange: (v: string | undefined) => void;
	/** callback to provide full virtual FS and active entry path */
	onFilesChange?: (files: Record<string, string>, entry: string) => void;
	showSidebar?: boolean;
	/** optional initial virtual FS map */
	initialFiles?: Record<string, string>;
	initialEntry?: string;
	/** Called when user triggers a save via keyboard shortcut */
	onSave?: () => void;
	/** Incrementing counter from parent after a successful save; triggers dirty reset */
	saveCounter?: number;
	/** Whether editor is read-only */
	readOnly?: boolean;
}

const MonacoEditor = dynamic(
	() => import("@monaco-editor/react").then((m) => m.default),
	{ ssr: false },
);

// Simple debounce utility (executes fn after wait ms of no calls)
function debounce<F extends (...args: unknown[]) => void>(fn: F, wait = 250) {
	let t: ReturnType<typeof setTimeout> | undefined;
	return (...args: Parameters<F>) => {
		if (t) clearTimeout(t);
		t = setTimeout(() => fn(...args), wait);
	};
}

export function EditorPane({
	value,
	onChange,
	onFilesChange,
	showSidebar = true,
	initialFiles,
	initialEntry,
	onSave,
	saveCounter,
	readOnly = false,
}: Props) {
	const { theme } = useComputedTheme();

	const [files, setFiles] = useState<FileNode[]>(() => {
		if (initialFiles && Object.keys(initialFiles).length) {
			return Object.entries(initialFiles).map(([path, content]) => ({
				id: path,
				name: path,
				content,
				droppable: false,
				draggable: true,
				dirty: false,
			}));
		}
		return [
			{ id: "index.html", name: "index.html", content: value, dirty: false },
		];
	});
	const [activeId, setActiveId] = useState<string>(
		initialEntry ??
			(initialFiles ? Object.keys(initialFiles)[0] : "index.html"),
	);
	const [sidebarOpen, setSidebarOpen] = useState(false); // mobile overlay
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse

	const prevMapJson = React.useRef<string>("");
	useEffect(() => {
		const active = files.find((f) => f.id === activeId);
		if (active) {
			onChange(active.content);
		}

		if (onFilesChange) {
			const map: Record<string, string> = {};
			for (const n of files) {
				if (n.content != null) map[n.id] = n.content;
			}
			const mapJson = JSON.stringify(map);
			const entryPath = activeId;

			if (prevMapJson.current !== mapJson) {
				prevMapJson.current = mapJson;
				onFilesChange(map, entryPath);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, files, onChange, onFilesChange]);

	function handleEditorChange(v?: string) {
		if (readOnly) return; // ignore edits in read-only mode
		setFiles((prev) =>
			prev.map((f) =>
				f.id === activeId ? { ...f, content: v ?? "", dirty: true } : f,
			),
		);
		onChange(v);
	}

	// When outer value changes (HTML emails), sync into internal state
	useEffect(() => {
		if (!showSidebar) {
			setFiles((prev) =>
				prev.map((f) => (f.id === "index.html" ? { ...f, content: value } : f)),
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, showSidebar]);

	// When saveCounter increments, clear dirty flags
	const prevSaveCounter = React.useRef<number | undefined>(saveCounter);
	useEffect(() => {
		if (saveCounter !== undefined && saveCounter !== prevSaveCounter.current) {
			setFiles((prev) => prev.map((f) => ({ ...f, dirty: false })));
			prevSaveCounter.current = saveCounter;
		}
	}, [saveCounter]);

	const activeFile = files.find((f) => f.id === activeId);

	// Determine language based on extension
	const language = React.useMemo(() => {
		const name = activeFile?.name ?? "";
		const ext = name.split(".").pop()?.toLowerCase() ?? "";
		switch (ext) {
			case "html":
				return "html";
			case "css":
				return "css";
			case "ts":
			case "tsx":
				return "typescript"; // TSX handled via compiler options
			case "js":
			case "jsx":
				return "javascript";
			default:
				return "text";
		}
	}, [activeFile?.name]);

	// Configure compiler options once Monaco is mounted
	const handleMount = React.useCallback(
		(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
			// Configure TS/JS compiler options
			monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
				target: monaco.languages.typescript.ScriptTarget.ESNext,
				allowNonTsExtensions: true,
				allowJs: true,
				jsx: monaco.languages.typescript.JsxEmit.React,
				esModuleInterop: true,
				moduleResolution:
					monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			});
			monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
				target: monaco.languages.typescript.ScriptTarget.ESNext,
				allowNonTsExtensions: true,
				jsx: monaco.languages.typescript.JsxEmit.React,
			});

			// ------------------------------------------------------------------
			// Suppress "cannot find module" & missing declaration errors for
			// external CDN imports (e.g. esm.sh). These modules resolve at runtime
			// but are not present in the virtual FS, so we add:
			//   1. A catch-all ambient module declaration
			//   2. Diagnostic ignore list for common codes (2307, 7016, 2305)
			// ------------------------------------------------------------------
			// const wildcardDecl = `declare module "*" {\n  const anyExport: any;\n  export default anyExport;\n}`;
			// monaco.languages.typescript.typescriptDefaults.addExtraLib(
			// 	wildcardDecl,
			// 	"file:///node_modules/@types/__wildcard__.d.ts",
			// );

			monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
				diagnosticCodesToIgnore: [2307, 7016, 2305, 2614, 2304],
			});

			// Register save shortcut (Cmd/Ctrl+S) to propagate save action upstream
			if (onSave) {
				editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
					onSave();
				});
			}

			// -----------------------------------------------------------
			// Forward TypeScript/JavaScript diagnostics (red squiggles)
			// from Monaco to the shared console feed so users can see
			// them alongside runtime messages.
			// -----------------------------------------------------------
			const broadcastDiagnostics = debounce(() => {
				if (typeof window === "undefined") return;
				const model = editor.getModel();
				if (!model) return;
				const markers = monaco.editor.getModelMarkers({ resource: model.uri });
				// Always clear previous diagnostic logs so we don't accumulate stale ones
				window.postMessage({ type: "console_clear" }, "*");
				for (const m of markers) {
					if (
						m.severity !== monaco.MarkerSeverity.Error &&
						m.severity !== monaco.MarkerSeverity.Warning
					)
						continue;
					const loc = `${model.uri.path}:${m.startLineNumber}:${m.startColumn}`;
					const msg = `${m.severity === monaco.MarkerSeverity.Warning ? "Warning" : "Error"}: ${m.message} (${loc})`;
					window.postMessage(
						{
							type: "console",
							method:
								m.severity === monaco.MarkerSeverity.Warning ? "warn" : "error",
							args: [msg],
						},
						"*",
					);
				}
			}, 250);

			// Initial emit and on-change listener
			broadcastDiagnostics();
			const disposable = monaco.editor.onDidChangeMarkers((uris) => {
				const model = editor.getModel();
				if (!model) return;
				if (uris.some((u) => u.toString() === model.uri.toString())) {
					broadcastDiagnostics();
				}
			});

			// Cleanup on unmount
			return () => {
				disposable.dispose();
			};
		},
		[onSave],
	);

	// -------------------------------------------------------------
	// Fetch .d.ts from esm.sh for any bare-module imports we detect
	// -------------------------------------------------------------
	useEffect(() => {
		if (!activeFile) return;
		const IMPORT_RE =
			/(?:import|export)\s+(?:[^'";]+?from\s+)?["']([^\.\/'"`][^'"`]+)["']/g;
		const DYNAMIC_RE = /import\(\s*["']([^\.\/'"`][^'"`]+)["']\s*\)/g;
		const seen = new Set<string>();

		const collectSpecifiers = (content: string): void => {
			IMPORT_RE.lastIndex = 0;
			while (true) {
				const match = IMPORT_RE.exec(content);
				if (!match) break;
				seen.add(match[1]);
			}
			DYNAMIC_RE.lastIndex = 0;
			while (true) {
				const match = DYNAMIC_RE.exec(content);
				if (!match) break;
				seen.add(match[1]);
			}
		};

		for (const file of files) {
			if (file.content) collectSpecifiers(file.content);
		}

		// Fire off loads in the background (Monaco lives on globalThis when mounted)
		interface GlobalWithMonaco {
			monaco?: typeof Monaco;
		}
		if (typeof globalThis !== "undefined") {
			const monacoGlobal = (globalThis as GlobalWithMonaco).monaco;
			if (monacoGlobal) {
				for (const spec of seen) {
					void loadRemoteTypes(monacoGlobal, spec);
				}
			}
		}
	}, [files, activeFile]);

	return (
		<div className="relative flex h-full w-full min-w-0">
			{showSidebar && !sidebarCollapsed && (
				<>
					{/* Sidebar */}
					<div
						className={cn(
							"md:block! hidden h-full w-52 shrink-0 border-r bg-muted p-2 pb-0",
							sidebarOpen && "absolute top-0 left-0 z-20 block md:relative",
						)}
					>
						<FileExplorer
							files={files}
							activeId={activeId}
							setActiveId={setActiveId}
							setFiles={setFiles}
							onCollapse={() => {
								if (sidebarOpen) {
									setSidebarOpen(false); // close mobile overlay
								} else {
									setSidebarCollapsed(true); // collapse desktop sidebar
								}
							}}
						/>
					</div>

					{/* Mobile open sidebar button (overlay) */}
					{!sidebarOpen && (
						<button
							type="button"
							className="absolute bottom-2 left-2 z-30 rounded border bg-background p-1 shadow md:top-2 md:bottom-auto dark:bg-white/10"
							onClick={() => setSidebarOpen(true)}
						>
							<PanelLeftOpen className="size-4.5" />
						</button>
					)}
				</>
			)}

			{/* Re-open sidebar button when collapsed (both mobile & desktop) */}
			{showSidebar && sidebarCollapsed && (
				<button
					type="button"
					className="absolute bottom-2 left-2 z-30 rounded border bg-background p-1 shadow md:top-2 md:bottom-auto dark:bg-white/10"
					onClick={() => setSidebarCollapsed(false)}
				>
					<PanelLeftOpen className="size-4.5" />
				</button>
			)}

			{/* Editor */}
			<div className="min-w-0 flex-1">
				<MonacoEditor
					// @ts-expect-error - onMount is a valid prop for MonacoEditor (https://github.com/suren-atoyan/monaco-react#usage)
					onMount={handleMount}
					path={activeFile?.name}
					theme={theme === "dark" ? "vs-dark" : "light"}
					language={language}
					value={activeFile?.content ?? ""}
					onChange={handleEditorChange}
					options={{
						scrollBeyondLastLine: false,
						automaticLayout: true,
						fontSize: 14,
						minimap: { enabled: false },
						readOnly,
					}}
				/>
				{/* <Editor
					height="80vh"
					theme="vs-dark"
					path={file.name}
					defaultLanguage={file.language}
					defaultValue={file.value}
				/> */}
			</div>
		</div>
	);
}
