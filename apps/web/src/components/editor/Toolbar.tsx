"use client";
import * as Select from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CLIENTS, type Client, ENGINES, type Engine } from "@diff-email/shared";
import {
	Check,
	Globe,
	ImageIcon,
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
		method: "error" | "warn";
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
	} = props;

	const errorCount = consoleLogs.filter((l) => l.method === "error").length;
	const warnCount = consoleLogs.filter((l) => l.method === "warn").length;
	const infoCount = consoleLogs.filter(
		(l) => l.method !== "error" && l.method !== "warn",
	).length;
	const consoleBadgeCounts: [number, string][] = [
		[errorCount, "bg-red-600"],
		[warnCount, "bg-yellow-600"],
		[infoCount, "bg-blue-600"],
	];
	const consoleBadgeClasses = (count: number) =>
		cn(
			"flex h-4 min-w-4 items-center justify-center rounded-full font-mono",
			"font-medium text-[12px] text-white leading-none tracking-wide subpixel-antialiased",
			// fine-tuned padding to display single-digit badges as circles
			count < 10 ? "px-1" : "px-1.25",
		);

	// Local zen mode state (not persisted)
	const [zenMode, setZenMode] = useState<boolean>(
		typeof document !== "undefined"
			? document.body.classList.contains("zen-mode")
			: false,
	);
	const toggleZenMode = useCallback(() => setZenMode((prev) => !prev), []);

	// Local saving state to show active style and spinner icon
	const [isSaving, setIsSaving] = useState(false);

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
				"flex items-center gap-2 border-b px-2 py-1",
				"bg-muted/50 text-sm max-md:pb-safe-offset-1",
			)}
		>
			{/* View Toggle (Web vs Screenshots) */}
			<div className="flex items-center gap-0">
				<button
					type="button"
					className={cn(
						"inline-flex size-7 items-center justify-center rounded-r-none rounded-l-sm border border-border p-1 shadow-xs",
						mode === "live" ? "bg-border" : "hover:bg-muted",
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
						mode === "screenshot" ? "bg-border" : "hover:bg-muted",
					)}
					onClick={() => setMode("screenshot")}
					title="Screenshots grid"
				>
					<Images size={16} />
				</button>
			</div>

			{/* Email entry & export inputs (shown only if setters provided) */}
			{language === "jsx" && setEntryPath && setExportName && (
				<div className="flex items-center gap-1.5 max-md:hidden">
					{/* Entry file path */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Input
								type="text"
								className="h-7 w-28 px-2 text-xs"
								placeholder="index.tsx"
								value={entryPath ?? ""}
								onChange={(e) => setEntryPath?.(e.target.value)}
								onBlur={(e) => {
									if (!e.target.value.trim()) {
										setEntryPath?.("index.tsx");
									}
								}}
							/>
						</TooltipTrigger>
						<TooltipContent>Entry File</TooltipContent>
					</Tooltip>

					{/* Export name */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Input
								type="text"
								className="h-7 w-28 px-2 text-xs"
								placeholder="default"
								value={exportName ?? ""}
								onChange={(e) => setExportName?.(e.target.value)}
								onBlur={(e) => {
									if (!e.target.value.trim()) {
										setExportName?.("default");
									}
								}}
							/>
						</TooltipTrigger>
						<TooltipContent>Export Name</TooltipContent>
					</Tooltip>
				</div>
			)}

			<div className="ml-auto flex items-center gap-1.25">
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
				</button>

				{/* Zen mode toggle */}
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
