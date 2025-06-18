"use client";
import * as Select from "@/components/ui/dropdown-menu";
import { CLIENTS, type Client, ENGINES, type Engine } from "@diff-email/shared";
import { ImageIcon, Moon, PlayIcon, Sun } from "lucide-react";

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
	} = props;

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

			<div className="ml-auto flex items-center gap-4">
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
					onClick={onSave}
					title="Save version"
				>
					💾
				</button>

				<button
					type="button"
					className="rounded border p-1"
					onClick={onRun}
					title="Generate screenshots"
				>
					<ImageIcon size={16} />
				</button>
			</div>
		</div>
	);
}
