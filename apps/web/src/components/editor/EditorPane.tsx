"use client";
import type { FileNode } from "@/components/tree-view";
import { useComputedTheme } from "@/hooks/useComputedTheme";
import { cn } from "@/lib/utils";
import { Menu, PanelLeftOpen } from "lucide-react";
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
}

const MonacoEditor = dynamic(
	() => import("@monaco-editor/react").then((m) => m.default),
	{ ssr: false },
);

export function EditorPane({
	value,
	onChange,
	onFilesChange,
	showSidebar = true,
	initialFiles,
	initialEntry,
	onSave,
	saveCounter,
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

			// Register save shortcut (Cmd/Ctrl+S) to propagate save action upstream
			if (onSave) {
				editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
					onSave();
				});
			}
		},
		[onSave],
	);

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
							onCollapse={() => setSidebarCollapsed(true)}
						/>
					</div>

					{/* Mobile toggle button (hide/show overlay) */}
					<button
						type="button"
						className="md:hidden! absolute top-2 left-2 z-30 rounded border bg-background p-1 shadow"
						onClick={() => setSidebarOpen((s) => !s)}
					>
						<Menu className="size-4" />
					</button>
				</>
			)}

			{/* Open sidebar button when collapsed */}
			{showSidebar && sidebarCollapsed && (
				<button
					type="button"
					className="absolute top-2 left-2 z-30 rounded border bg-background p-1 shadow dark:bg-white/10"
					onClick={() => setSidebarCollapsed(false)}
				>
					<PanelLeftOpen className="size-4" />
				</button>
			)}

			{/* Editor */}
			<div className="min-w-0 flex-1">
				<MonacoEditor
					// @ts-expect-error - onMount is a valid prop for MonacoEditor (https://github.com/suren-atoyan/monaco-react#usage)
					onMount={handleMount}
					theme={theme === "dark" ? "vs-dark" : "light"}
					language={language}
					value={activeFile?.content ?? ""}
					onChange={handleEditorChange}
					options={{
						scrollBeyondLastLine: false,
						automaticLayout: true,
						fontSize: 14,
						minimap: { enabled: false },
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
