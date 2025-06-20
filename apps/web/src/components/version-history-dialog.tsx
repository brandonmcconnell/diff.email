"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows } from "lucide-react";
import { useState } from "react";

interface Props {
	emailId: string;
	versionCount: number;
}

/**
 * Button + dialog to display full version history for an email.
 */
export function VersionHistoryDialog({ emailId, versionCount }: Props) {
	const [open, setOpen] = useState(false);

	const historyQuery = useQuery({
		...trpc.versions.list.queryOptions({ emailId }),
		enabled: open,
	});

	const versions = historyQuery.data ?? [];

	// Compute display number: newest = N, oldest = 1
	function getLabel(idx: number) {
		return `v${versionCount - idx}`;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					className="inline-flex items-center gap-2 text-muted-foreground"
				>
					<GitCompareArrows className="size-5" />
					<span className="text-sm">v{versionCount}</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md" showCloseButton>
				<DialogHeader>
					<DialogTitle>Version History</DialogTitle>
				</DialogHeader>
				<div className="h-[400px] w-full overflow-y-auto pr-2">
					<div className="flex flex-col divide-y">
						{historyQuery.isFetching && (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Loading…
							</p>
						)}
						{versions.map(
							(v: { id: string; createdAt: string }, idx: number) => (
								<div
									key={v.id}
									className="flex items-center justify-between py-2 text-sm"
								>
									<span className="font-mono text-muted-foreground text-xs">
										{getLabel(idx)}
									</span>
									<span>
										{new Date(v.createdAt as string).toLocaleString()}
									</span>
								</div>
							),
						)}
						{!historyQuery.isFetching && versions.length === 0 && (
							<p className="py-4 text-center text-muted-foreground text-sm">
								No versions yet.
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
