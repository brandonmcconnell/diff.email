import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

interface ListSkeletonProps {
	rows?: number;
	className?: string;
}

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: rows }).map((_, idx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton elements
				<Skeleton key={idx} className="h-10 w-full" />
			))}
		</div>
	);
}

// Empty state renderer (internal)
function renderEmpty({
	emptyIcon: EmptyIcon,
	title,
	description,
	onCreate,
	createLabel,
	createIcon: CreateIcon,
}: {
	emptyIcon?: React.ComponentType<{ className?: string }>;
	title: string;
	description?: string;
	onCreate: () => void;
	createIcon?: React.ComponentType<{ className?: string }>;
	createLabel: string;
}) {
	return (
		<div className="flex flex-col items-center gap-6 rounded-md border border-border border-dashed p-6 text-center">
			{EmptyIcon && (
				<div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card text-card-foreground shadow-sm">
					<EmptyIcon className="size-6" />
				</div>
			)}
			<div className="space-y-2">
				<h1 className="font-semibold text-lg md:text-xl">{title}</h1>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			<Button onClick={onCreate}>
				{CreateIcon && <CreateIcon className="size-4" />}
				{createLabel}
			</Button>
		</div>
	);
}

// Generic simple list pattern for projects, emails, etc.
export interface BasicItem {
	id: string;
	name: string;
}

export interface ListAction<T extends BasicItem> {
	label: string;
	onSelect: (item: T) => void;
	className?: string;
}

interface DataListProps<T extends BasicItem> {
	items: T[];
	href: (item: T) => string;
	actions?: ListAction<T>[];
	onCreate: () => void;
	emptyTitle: string;
	emptyDescription?: string;
	emptyIcon?: React.ComponentType<{ className?: string }>;
	createLabel: string;
	createIcon?: React.ComponentType<{ className?: string }>;
}

export function DataList<T extends BasicItem>({
	items,
	href,
	actions,
	onCreate,
	emptyTitle,
	emptyDescription,
	emptyIcon,
	createLabel,
	createIcon,
}: DataListProps<T>) {
	if (items.length === 0) {
		return renderEmpty({
			emptyIcon,
			title: emptyTitle,
			description: emptyDescription,
			onCreate,
			createLabel,
			createIcon,
		});
	}

	return (
		<ul className="space-y-2">
			{items.map((item) => (
				<li key={item.id} className="flex items-center justify-between gap-2">
					<Button variant="outline" className="flex-1 justify-start" asChild>
						<Link href={href(item)}>{item.name}</Link>
					</Button>
					{actions && actions.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<EllipsisVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{actions.map((a) => (
									<DropdownMenuItem
										key={a.label}
										className={a.className}
										onSelect={() => a.onSelect(item)}
									>
										{a.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</li>
			))}
		</ul>
	);
}
