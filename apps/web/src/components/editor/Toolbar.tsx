"use client";
import * as Select from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CLIENTS, type Client, ENGINES, type Engine } from "@diff-email/shared";
import { ImageIcon, Moon, PlayIcon, Save, Sun, Terminal } from "lucide-react";

type Props = {
	engine: Engine;
	setEngine: (e: Engine) => void;
	client: Client;
	setClient: (c: Client) => void;
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
};

export function Toolbar(props: Props) {
	const {
		engine,
		setEngine,
		client,
		setClient,
		mode,
		setMode,
		dark,
		setDark,
		onSave,
		onRun,
		consoleVisible,
		setConsoleVisible,
		consoleLogs,
	} = props;

	const errorCount = consoleLogs.filter((l) => l.method === "error").length;
	const warnCount = consoleLogs.filter((l) => l.method === "warn").length;
	const infoCount = consoleLogs.filter(
		(l) => l.method !== "error" && l.method !== "warn",
	).length;
	const consoleBadgeCounts: [number, string][] = [
		[infoCount, "bg-blue-600"],
		[errorCount, "bg-red-600"],
		[warnCount, "bg-amber-600"],
	];
	const consoleBadgeClasses =
		"flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] text-white";

	return (
		<div className="flex items-center gap-2 border-b px-2 py-1 text-sm">
			{/* Engine Select */}
			<Select.DropdownMenu>
				<Select.DropdownMenuTrigger asChild>
					<button type="button" className="rounded border px-2 py-1 capitalize">
						{engine}
					</button>
				</Select.DropdownMenuTrigger>
				<Select.DropdownMenuContent className="w-32">
					{ENGINES.map((e: Engine) => (
						<Select.DropdownMenuItem
							key={e}
							className="capitalize"
							onSelect={() => setEngine(e)}
						>
							{e}
						</Select.DropdownMenuItem>
					))}
				</Select.DropdownMenuContent>
			</Select.DropdownMenu>

			{/* Client Select */}
			<Select.DropdownMenu>
				<Select.DropdownMenuTrigger asChild>
					<button type="button" className="rounded border px-2 py-1 capitalize">
						{client}
					</button>
				</Select.DropdownMenuTrigger>
				<Select.DropdownMenuContent className="w-32">
					{CLIENTS.map((c: Client) => (
						<Select.DropdownMenuItem
							key={c}
							className="capitalize"
							onSelect={() => setClient(c)}
						>
							{c}
						</Select.DropdownMenuItem>
					))}
				</Select.DropdownMenuContent>
			</Select.DropdownMenu>

			<div className="ml-auto flex items-center gap-1.5">
				{/* Mode Toggle */}
				<button
					type="button"
					className="rounded border p-1"
					onClick={() => setMode(mode === "live" ? "screenshot" : "live")}
					title="Toggle live/screenshot"
				>
					{mode === "live" ? <PlayIcon size={16} /> : <ImageIcon size={16} />}
				</button>

				{/* Dark/light toggle */}
				<button
					type="button"
					className="rounded border p-1"
					onClick={() => setDark(!dark)}
					title="Toggle dark mode"
				>
					{dark ? <Moon size={16} /> : <Sun size={16} />}
				</button>

				<button
					type="button"
					className="rounded border p-1"
					onClick={onRun}
					title="Generate screenshots"
				>
					<ImageIcon size={16} />
				</button>

				<button
					type="button"
					className={cn(
						"flex items-center gap-1 rounded border p-1",
						consoleVisible ? "bg-border" : "hover:bg-muted",
					)}
					onClick={() => setConsoleVisible(!consoleVisible)}
					title="Toggle console"
				>
					<Terminal size={16} />
					{consoleBadgeCounts.map(
						([count, color]) =>
							count > 0 && (
								<span key={color} className={cn(consoleBadgeClasses, color)}>
									{count}
								</span>
							),
					)}
				</button>

				<button
					type="button"
					className="rounded border p-1"
					onClick={onSave}
					title="Save version"
				>
					<Save size={16} />
				</button>
			</div>
		</div>
	);
}
