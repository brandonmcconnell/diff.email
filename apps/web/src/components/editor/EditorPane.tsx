"use client";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FileExplorer, type FileNode } from "./FileExplorer";

interface Props {
	value: string;
	onChange: (v: string | undefined) => void;
}

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
	}, [activeId, onChange]);

	function handleEditorChange(v?: string) {
		setFiles((prev) =>
			prev.map((f) => (f.id === activeId ? { ...f, content: v ?? "" } : f)),
		);
		onChange(v);
	}

	const activeFile = files.find((f) => f.id === activeId);

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
				<Editor
					theme={theme === "dark" ? "vs-dark" : "light"}
					language="html"
					value={activeFile?.content ?? ""}
					onChange={handleEditorChange}
					options={{
						scrollBeyondLastLine: false,
						automaticLayout: true,
					}}
				/>
			</div>
		</div>
	);
}
