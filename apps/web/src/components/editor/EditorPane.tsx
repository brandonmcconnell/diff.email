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
	/** callback to provide full virtual FS and active entry path */
	onFilesChange?: (files: Record<string, string>, entry: string) => void;
	showSidebar?: boolean;
	/** optional initial virtual FS map */
	initialFiles?: Record<string, string>;
	initialEntry?: string;
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
}: Props) {
	const { theme } = useTheme();

	const [files, setFiles] = useState<FileNode[]>(() => {
		if (initialFiles && Object.keys(initialFiles).length) {
			return Object.entries(initialFiles).map(([path, content]) => ({
				id: path,
				name: path,
				content,
				droppable: false,
				draggable: true,
			}));
		}
		return [{ id: "index.html", name: "index.html", content: value }];
	});
	const [activeId, setActiveId] = useState<string>(
		initialEntry ??
			(initialFiles ? Object.keys(initialFiles)[0] : "index.html"),
	);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const prevMapJson = React.useRef<string>("");
	useEffect(() => {
		const active = files.find((f) => f.id === activeId);
		if (active) {
			onChange(active.content);
		}

		if (onFilesChange) {
			const map: Record<string, string> = {};
			function walk(nodes: FileNode[], prefix = "") {
				for (const n of nodes) {
					const path = prefix + n.name;
					if (n.content != null) map[path] = n.content;
					if (n.children) walk(n.children as FileNode[], `${path}/`);
				}
			}
			walk(files);
			const mapJson = JSON.stringify(map);
			const entryPath =
				collectPath(files, activeId) ??
				files.find((f) => f.id === activeId)?.name ??
				"index.html";

			if (prevMapJson.current !== mapJson) {
				prevMapJson.current = mapJson;
				onFilesChange(map, entryPath);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, files, onChange, onFilesChange]);

	function collectPath(
		nodes: FileNode[],
		id: string,
		prefix = "",
	): string | null {
		for (const n of nodes) {
			const current = prefix + n.name;
			if (n.id === id) return current;
			if (n.children) {
				const found = collectPath(n.children as FileNode[], id, `${current}/`);
				if (found) return found;
			}
		}
		return null;
	}

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
			{showSidebar && (
				<>
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
				</>
			)}

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
