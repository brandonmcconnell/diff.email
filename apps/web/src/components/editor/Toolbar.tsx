"use client";
import * as Select from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
	Save,
	Sun,
	Terminal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
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
		[infoCount, "bg-blue-600"],
		[errorCount, "bg-red-600"],
		[warnCount, "bg-yellow-600"],
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
			<ToggleGroup
				type="single"
				value={mode === "live" ? "web" : "screenshots"}
				onValueChange={(val) => {
					if (!val) return;
					setMode(val === "web" ? "live" : "screenshot");
				}}
				variant="outline"
				size="sm"
			>
				<ToggleGroupItem value="web" aria-label="Web preview">
					<Globe size={14} />
				</ToggleGroupItem>
				<ToggleGroupItem value="screenshots" aria-label="Screenshots grid">
					<Images size={14} />
				</ToggleGroupItem>
			</ToggleGroup>

			{/* Email entry & export inputs (shown only if setters provided) */}
			{setEntryPath && setExportName && (
				<div className="flex items-center gap-1.5 max-md:hidden">
					<input
						type="text"
						className="h-7 w-40 rounded border border-input bg-background px-2 text-xs"
						placeholder="Entry file (e.g. index.tsx)"
						value={entryPath ?? ""}
						onChange={(e) => setEntryPath?.(e.target.value || undefined)}
						title="File to import and bundle"
					/>
					<input
						type="text"
						className="h-7 w-28 rounded border border-input bg-background px-2 text-xs"
						placeholder="Export name"
						value={exportName ?? ""}
						onChange={(e) => setExportName?.(e.target.value || "default")}
						title="Named export to render"
					/>
				</div>
			)}

			<div className="ml-auto flex items-center gap-1.5">
				<button
					type="button"
					className={cn(
						"rounded border border-neutral-800/15 p-1",
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
						"flex items-center gap-1 rounded border border-neutral-800/15 p-1",
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
						"rounded border border-neutral-800/15 p-1",
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
						"relative flex items-center rounded border border-neutral-800/15 p-1",
						(!isDirty || readOnly) && "bg-muted text-muted-foreground",
					)}
					onClick={readOnly ? undefined : onSave}
					disabled={readOnly}
					title={readOnly ? "Read-only" : "Save version"}
				>
					<Save size={16} />
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
