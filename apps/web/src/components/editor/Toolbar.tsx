"use client";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Client, Engine } from "@diff-email/shared";
import {
	FolderCheck,
	FolderX,
	Globe,
	Images,
	Maximize2,
	Minimize2,
	Moon,
	RefreshCcw,
	Save,
	Sun,
	Terminal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConsoleMethod } from "./PreviewPane";

type Props = {
	language?: "jsx" | "html";
	// Currently unused, but passed down from parent for future expansion.
	engine?: Engine;
	setEngine?: (e: Engine) => void;
	client?: Client;
	setClient?: (c: Client) => void;
	mode: "live" | "screenshot";
	setMode: (m: "live" | "screenshot") => void;
	dark: boolean;
	setDark: (d: boolean) => void;
	onSave: () => void;
	onRun: () => void;
	consoleVisible: boolean;
	setConsoleVisible: (v: boolean) => void;
	consoleLogs: Array<{
		data: string[];
		method: ConsoleMethod;
	}>;
	/** Whether there are unsaved changes */
	isDirty: boolean;
	readOnly?: boolean;
	/** Custom entry file path override */
	entryPath?: string;
	setEntryPath?: (p: string | undefined) => void;
	/** Export name to render with @react-email/render */
	exportName?: string;
	setExportName?: (e: string) => void;
	/** Virtual file system (path -> contents) for validation */
	files?: Record<string, string>;
	/** Which high-level view is active (code editor or preview) */
	view?: "editor" | "preview";
};

export function Toolbar(props: Props) {
	const {
		language,
		mode,
		setMode,
		dark,
		setDark,
		onSave,
		onRun,
		consoleVisible,
		setConsoleVisible,
		consoleLogs,
		isDirty,
		readOnly = false,
		entryPath,
		setEntryPath,
		exportName,
		setExportName,
		files,
		view = "preview",
	} = props;

	let [errorCount, warnCount, infoCount, debugCount, otherCount]: number[] =
		Array(5).fill(0);
	for (const log of consoleLogs) {
		switch (log.method) {
			case "error":
				errorCount++;
				break;
			case "warn":
				warnCount++;
				break;
			case "info":
				infoCount++;
				break;
			case "debug":
				debugCount++;
				break;
			default:
				otherCount++;
				break;
		}
	}
	const consoleBadgeCounts: [number, string][] = [
		[errorCount, "bg-red-500 md:bg-red-600"],
		[warnCount, "bg-amber-500 md:bg-yellow-600"],
		[debugCount, "bg-fuchsia-500 md:bg-fuchsia-600"],
		[infoCount, "bg-blue-500 md:bg-blue-600"],
		[otherCount, "bg-neutral-400 md:bg-neutral-500"],
	];
	const consoleBadgeClasses = (count: number) => {
		return cn(
			"flex h-4 min-w-4 items-center justify-center font-mono subpixel-antialiased",
			"font-medium text-[12px] text-white leading-none tracking-wide",
			"first-of-type:rounded-l-full last-of-type:rounded-r-full",
			// fine-tuned padding to display single-digit badges as circles
			count < 10 ? "px-1" : "px-1.25",
			"first-of-type:not-last-of-type:pl-1.5",
			"last-of-type:not-first-of-type:pr-1.5",
		);
	};

	// Local zen mode state (not persisted)
	const [zenMode, setZenMode] = useState<boolean>(
		typeof document !== "undefined"
			? document.body.classList.contains("zen-mode")
			: false,
	);
	const toggleZenMode = useCallback(() => setZenMode((prev) => !prev), []);

	// Local saving state to show active style and spinner icon
	const [isSaving, setIsSaving] = useState(false);

	function stripComments(code: string): string {
		// Remove /* block */ comments
		let out = code.replace(/\/\*[\s\S]*?\*\//g, "");
		// Remove // line comments
		out = out.replace(/(^|[^:])\/\/.*$/gm, "$1");
		return out;
	}

	const hasConfigError = (() => {
		if (language !== "jsx" || !files) return false;
		if (!entryPath || !(entryPath in files)) return true;
		if (!exportName) return true;
		const rawSource = files[entryPath] ?? "";
		const source = stripComments(rawSource);
		if (exportName === "default") {
			// Assume default export always exists as we render default
			return !/export\s+default\s+/m.test(source);
		}
		// Simple regex to check named export
		const escaped = exportName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const re = new RegExp(
			`export\\s+(?:const|let|var|function|class|interface|type)\\s+${escaped}\\b|export\\s*{[^}]*\\b${escaped}\\b`,
			"m",
		);
		return !re.test(source);
	})();

	const handleSave = useCallback(async () => {
		if (readOnly || isSaving) return;
		setIsSaving(true);
		const start = Date.now();

		const saveOperation = Promise.resolve(onSave());

		try {
			await toast.promise(saveOperation, {
				loading: "Saving…",
				success: "Saved!",
				error: (err) => err.message ?? "Failed to save",
			});
		} finally {
			const elapsed = Date.now() - start;
			const minVisible = 300; // ensure spinner shown
			window.setTimeout(
				() => setIsSaving(false),
				Math.max(0, minVisible - elapsed),
			);
		}
	}, [onSave, readOnly, isSaving]);

	useEffect(() => {
		if (typeof document !== "undefined") {
			document.body.classList[zenMode ? "add" : "remove"]("zen-mode");
		}
		return () => {
			if (typeof document !== "undefined") {
				document.body.classList.remove("zen-mode");
			}
		};
	}, [zenMode]);

	return (
		<div
			className={cn(
				"flex items-center gap-2 px-2 py-1",
				"bg-muted/50 text-sm max-md:pb-safe-offset-1",
				"max-md:border-t md:border-b",
			)}
		>
			{/* View Toggle (Web vs Screenshots) */}
			<div className="flex items-center gap-0">
				<button
					type="button"
					className={cn(
						"inline-flex size-7 items-center justify-center rounded-r-none rounded-l-sm border border-border p-1 shadow-xs",
						mode === "live"
							? "z-1 bg-border"
							: "border-r-transparent hover:bg-muted",
					)}
					onClick={() => setMode("live")}
					title="Web preview"
				>
					<Globe size={16} />
				</button>
				<button
					type="button"
					className={cn(
						"-ml-px inline-flex size-7 items-center justify-center rounded-r-sm rounded-l-none border border-border p-1 shadow-xs",
						mode === "screenshot"
							? "z-1 bg-border"
							: "border-l-transparent hover:bg-muted",
					)}
					onClick={() => setMode("screenshot")}
					title="Screenshots grid"
				>
					<Images size={16} />
				</button>
			</div>

			<div className="ml-auto flex items-center gap-1.25">
				{/* Email entry & export inputs – Popover */}
				{language === "jsx" && setEntryPath && setExportName && (
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className={cn(
									"inline-flex size-7 items-center justify-center rounded-sm border p-1 shadow-xs",
									hasConfigError
										? cn(
												"relative border-destructive/20 text-destructive hover:bg-destructive/10",
												"before:absolute before:inset-0 before:rounded-[inherit] before:content-['']",
												"before:pointer-events-none before:border-0 before:bg-destructive/20",
												"before:animation-duration-1250 before:animate-ping before:transition-opacity",
												"hover:before:opacity-0 data-[state=open]:before:opacity-0",
												"data-[state=open]:bg-border! data-[state=closed]:hover:bg-muted!",
											)
										: "border-border hover:bg-muted",
								)}
								aria-invalid={hasConfigError}
								title={
									hasConfigError
										? "Invalid entry path or export name"
										: "Editor settings"
								}
							>
								<div className="pointer-events-none">
									{hasConfigError ? (
										<FolderX size={16} />
									) : (
										<FolderCheck size={16} />
									)}
								</div>
							</button>
						</PopoverTrigger>
						<PopoverContent>
							<div className="flex flex-col gap-2">
								<div className="flex flex-col gap-1">
									<label
										htmlFor="entry-path"
										className="font-medium text-foreground/80 text-xs"
									>
										Entry File Path
									</label>
									<Input
										id="entry-path"
										type="text"
										placeholder="index.tsx"
										value={entryPath ?? ""}
										onChange={(e) => setEntryPath?.(e.target.value)}
										onBlur={(e) => {
											if (!e.target.value.trim()) {
												setEntryPath?.("index.tsx");
											}
										}}
										className="h-7 px-2 text-xs"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label
										htmlFor="export-name"
										className="font-medium text-foreground/80 text-xs"
									>
										Export Name
									</label>
									<Input
										id="export-name"
										type="text"
										placeholder="default"
										value={exportName ?? ""}
										onChange={(e) => setExportName?.(e.target.value)}
										onBlur={(e) => {
											if (!e.target.value.trim()) {
												setExportName?.("default");
											}
										}}
										className="h-7 px-2 text-xs"
									/>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				)}

				{/* Dark mode toggle (light/dark) – only visible in preview view */}
				{view === "preview" && (
					<button
						type="button"
						className={cn(
							"inline-flex size-7 items-center justify-center rounded-sm border border-border p-1 shadow-xs",
							dark ? "bg-border" : "hover:bg-muted",
						)}
						onClick={() => setDark(!dark)}
						title="Toggle dark mode"
					>
						{dark ? <Moon size={16} /> : <Sun size={16} />}
					</button>
				)}

				{/* Console toggle (error/warning/info) */}
				<button
					type="button"
					className={cn(
						"flex h-7 min-w-7 items-center gap-1 rounded-sm border border-border px-1.25 shadow-xs",
						consoleVisible ? "bg-border" : "hover:bg-muted",
					)}
					onClick={() => setConsoleVisible(!consoleVisible)}
					title="Toggle console"
				>
					<Terminal size={16} />
					<div className="hidden items-center gap-px md:flex">
						{consoleBadgeCounts.map(
							([count, color]) =>
								count > 0 && (
									<span
										key={color}
										className={cn(consoleBadgeClasses(count), color)}
									>
										{count}
									</span>
								),
						)}
					</div>
					<div
						className={cn(
							"grid auto-cols-fr grid-flow-col grid-rows-2 gap-px md:hidden",
							"rounded border border-transparent p-0.5",
							consoleVisible && "border-neutral-900/20 bg-white",
						)}
					>
						{consoleBadgeCounts.map(
							([count, color]) =>
								count > 0 && (
									<div
										key={color}
										className={cn("box-content size-1.5 rounded-full", color)}
									/>
								),
						)}
					</div>
				</button>

				{/* Zen mode toggle (full screen) */}
				<button
					type="button"
					className={cn(
						"inline-flex size-7 items-center justify-center rounded-sm border border-border p-1 shadow-xs",
						zenMode ? "bg-border" : "hover:bg-muted",
					)}
					onClick={toggleZenMode}
					title={zenMode ? "Exit Zen mode" : "Enter Zen mode"}
				>
					{zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
				</button>

				{/* Save button */}
				<button
					type="button"
					className={cn(
						"relative flex h-7 min-w-7 items-center rounded-sm border border-border px-1.25 shadow-xs hover:bg-muted",
						isSaving && "bg-border",
					)}
					onClick={handleSave}
					disabled={readOnly || isSaving}
					title={readOnly ? "Read-only" : "Save version"}
				>
					{isSaving ? (
						<RefreshCcw size={16} className="animate-spin" />
					) : (
						<Save size={16} />
					)}
					<div
						className={cn(
							"inline-flex items-center justify-end",
							"overflow-hidden transition-[width] duration-300 ease-out",
							isDirty ? "w-2.5" : "w-0",
						)}
					>
						<div
							className={cn(
								"inline-block size-1.25 rounded-full bg-amber-500",
								"transition-[scale,opacity] duration-[inherit] ease-[inherit]",
								isDirty ? "scale-100 opacity-100" : "scale-0 opacity-0",
							)}
						/>
					</div>
				</button>
			</div>
		</div>
	);
}
