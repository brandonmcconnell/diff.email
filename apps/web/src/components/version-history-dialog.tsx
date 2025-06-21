"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows, RotateCw } from "lucide-react";
import { useState } from "react";

export type ReadOnlyVersion = {
	id: string;
	index: number; // position in list, for label calculation
	html?: string | null;
	files?: Record<string, string> | null;
};

type VersionData = {
	id: string;
	createdAt: string;
	html?: string | null;
	files?: unknown;
	// any other fields from API response
	[key: string]: unknown;
};

export interface Props {
	emailId: string;
	versionCount: number;
	readOnlyVersion: ReadOnlyVersion | null;
	onSelectVersion?: (v: VersionData, idx: number) => void;
	exitReadOnly?: () => void;
}

/**
 * Button + dialog to display full version history for an email.
 */
export function VersionHistoryDialog({
	emailId,
	versionCount,
	readOnlyVersion,
	onSelectVersion,
	exitReadOnly,
}: Props) {
	const [open, setOpen] = useState(false);

	const historyQuery = useQuery({
		...trpc.versions.list.queryOptions({ emailId }),
		enabled: open,
	});

	const versions = historyQuery.data ?? [];
	const viewingLatest = readOnlyVersion?.id == null;

	// Compute display number: newest = N, oldest = 1
	function getLabel(idx: number) {
		return `v${versionCount - idx}`;
	}

	// Convert timestamp to human-friendly relative string (e.g. "3h ago")
	function relativeTime(dateInput: string | Date): string {
		const date = new Date(dateInput);
		const diff = Date.now() - date.getTime();
		const seconds = Math.round(diff / 1000);
		const minutes = Math.round(seconds / 60);
		const hours = Math.round(minutes / 60);
		const days = Math.round(hours / 24);

		if (seconds < 60) return `${seconds}s ago`;
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className={
						readOnlyVersion?.id
							? cn(
									"inline-flex items-center gap-2",
									readOnlyVersion?.id !== null && "text-amber-600",
								)
							: "inline-flex items-center gap-2 text-muted-foreground"
					}
				>
					<GitCompareArrows className="size-5" />
					<span className="font-medium font-mono text-sm">
						v{versionCount - (readOnlyVersion?.index ?? 0)}
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="pb-0 sm:max-w-xs" showCloseButton={false}>
				<DialogHeader className="flex flex-row items-center justify-between gap-0.5">
					<DialogTitle>Version History</DialogTitle>
					{readOnlyVersion?.id && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={() => {
										exitReadOnly?.();
										setOpen(false);
									}}
								>
									<RotateCw className="size-5 text-amber-600" aria-hidden />
									<span className="sr-only">Exit read-only</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Reset to latest version
							</TooltipContent>
						</Tooltip>
					)}
				</DialogHeader>
				<div className="relative">
					<div className="absolute top-0 left-0 h-5 w-full border-none bg-gradient-to-b from-background to-transparent" />
					<div className="absolute bottom-0 left-0 h-5 w-full border-none bg-gradient-to-t from-background to-transparent" />
					<div className="h-[400px] w-full overflow-y-auto pr-2">
						<div className="flex flex-col divide-y">
							{historyQuery.isFetching && (
								<p className="enter py-4 text-c text-muted-foreground text-sm">
									Refreshing latest data…
								</p>
							)}
							{versions.map((v: VersionData, idx: number) => {
								const isActive = viewingLatest
									? idx === 0
									: v.id === readOnlyVersion?.id;
								return (
									<div
										key={v.id}
										className="flex items-center justify-between py-2 text-sm first-of-type:mt-2 last-of-type:mb-3"
									>
										<button
											type="button"
											onClick={() => {
												if (idx === 0) {
													exitReadOnly?.();
												} else {
													onSelectVersion?.(v, idx);
												}
												setOpen(false);
											}}
											className={cn(
												"font-mono",
												isActive
													? cn("font-bold", !viewingLatest && "text-amber-600")
													: "font-normal",
											)}
										>
											{getLabel(idx)}{" "}
											{idx === 0 && (
												<Badge
													variant="secondary"
													className={cn(
														"rounded-full font-sans text-xs tracking-wide",
														"bg-neutral-600/10 text-neutral-600",
														"dark:bg-neutral-100/10 dark:text-neutral-300/90!",
													)}
												>
													latest
												</Badge>
											)}
											{isActive && !viewingLatest && (
												<Badge
													variant="secondary"
													className={cn(
														"rounded-full font-sans text-xs tracking-wide",
														"bg-amber-600/20 text-amber-700",
														"dark:bg-amber-700/30 dark:text-amber-500/90!",
													)}
												>
													viewing
												</Badge>
											)}
										</button>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="cursor-default">
													{relativeTime(v.createdAt)}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{new Date(v.createdAt).toLocaleString()}
											</TooltipContent>
										</Tooltip>
									</div>
								);
							})}
							{!historyQuery.isFetching && versions.length === 0 && (
								<p className="py-4 text-center text-muted-foreground text-sm">
									No versions yet.
								</p>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
