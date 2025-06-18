"use client";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import type * as Monaco from "monaco-editor";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import React from "react";
import { FileExplorer, type FileNode } from "./FileExplorer";

interface Props {
	value: string;
	onChange: (v: string | undefined) => void;
}

// Dynamically import Monaco editor (client-side only) and cast to `any`
// so custom props like `onMount` are accepted without type errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MonacoEditor = dynamic(
	() => import("@monaco-editor/react").then((m) => m.default),
	{ ssr: false },
);

export function EditorPane({ value, onChange }: Props) {
	const { theme } = useTheme();

	const [files, setFiles] = useState<FileNode[]>([
		{ id: "index.html", name: "index.html", content: value },
	]);
	const [activeId, setActiveId] = useState<string>("index.html");
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Sync outer value when active file changes
	useEffect(() => {
		const active = files.find((f) => f.id === activeId);
		if (active) {
			onChange(active.content);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, files, onChange]);

	function handleEditorChange(v?: string) {
		setFiles((prev) =>
			prev.map((f) => (f.id === activeId ? { ...f, content: v ?? "" } : f)),
		);
		onChange(v);
	}

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
		(_editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
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
		},
		[],
	);

	return (
		<div className="relative flex h-full w-full">
			{/* Sidebar */}
			<div
				className={cn(
					"md:block! hidden h-full w-52 shrink-0 border-r bg-muted p-2",
					sidebarOpen && "absolute top-0 left-0 z-20 block md:relative",
				)}
			>
				<FileExplorer
					files={files}
					activeId={activeId}
					setActiveId={setActiveId}
					setFiles={setFiles}
				/>
			</div>

			{/* Toggle button for mobile */}
			<button
				type="button"
				className="md:hidden! absolute top-2 left-2 z-30 rounded border bg-background p-1 shadow"
				onClick={() => setSidebarOpen((s) => !s)}
			>
				<Menu className="size-4" />
			</button>

			{/* Editor */}
			<div className="flex-1">
				<MonacoEditor
					onMount={handleMount}
					theme={theme === "dark" ? "vs-dark" : "vs"}
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
