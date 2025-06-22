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
				<span className="max-md:hidden">{createLabel}</span>
			</Button>
		</div>
	);
}

// Generic simple list pattern for projects, emails, etc.
export interface BasicItem {
	id: string;
	name: string;
	description?: string | null;
	createdAt: string;
}

export interface ListAction<T extends BasicItem> {
	label: string;
	onSelect: (item: T) => void;
	className?: string;
}

type CardKey = "title" | "description" | "detail" | "detailLabel";

interface Column<T> {
	label: string;
	render: (item: T) => React.ReactNode;
	className?: string;
	/**
	 * When provided, makes this column appear in the mobile card layout.
	 * Use semantic keys rather than positions so the card renderer can decide styling.
	 */
	dataCardProperty?: CardKey;
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
	render?: (item: T, view: "grid" | "list") => React.ReactNode;
	columns?: Column<T>[];
	view?: "grid" | "list"; // Desktop view mode
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
	render,
	columns = [],
	view = "grid",
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

	const hasActions = actions && actions.length > 0;
	const colCount = 1 + columns.length;

	// Lookup of columns that belong in the card by their semantic key
	const cardColumnMap = columns.reduce<Partial<Record<CardKey, Column<T>>>>(
		(acc, col) => {
			if (col.dataCardProperty) acc[col.dataCardProperty] = col;
			return acc;
		},
		{},
	);

	return (
		<>
			{/* Card grid for mobile */}
			<div
				className={cn("grid gap-4", view === "list" && "md:hidden")}
				style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}
			>
				{items.map((item) => (
					<div key={item.id} className="relative rounded-md border">
						{/* Main clickable area */}
						<Link
							href={href(item)}
							className="flex min-h-[125px] flex-col gap-2 rounded-md p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{/* Name (title) */}
							<div className="truncate font-medium">
								{render ? render(item, "grid") : item.name}
							</div>

							{/* Description (optional) */}
							{cardColumnMap.description && (
								<span className="mt-0.5 mb-1 text-sm">
									{cardColumnMap.description.render(item)}
								</span>
							)}

							{/* Details section (bottom-left) */}
							{(cardColumnMap.detailLabel || cardColumnMap.detail) && (
								<div
									className={cn(
										"mt-auto flex flex-col",
										hasActions && "max-w-[calc(100%---spacing(9))]",
									)}
								>
									{cardColumnMap.detailLabel && (
										<span className="text-muted-foreground text-xs">
											{cardColumnMap.detailLabel.render(item)}
										</span>
									)}
									{cardColumnMap.detail && (
										<span className="text-sm">
											{cardColumnMap.detail.render(item)}
										</span>
									)}
								</div>
							)}
						</Link>

						{/* Actions button (absolute, not inside link) */}
						{hasActions && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="absolute right-4 bottom-4 shrink-0"
									>
										<EllipsisVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{actions?.map((a) => (
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
					</div>
				))}
			</div>

			<div
				className={cn("hidden", view === "list" && "md:block")}
				style={{ "--cols": colCount - 1 } as React.CSSProperties}
			>
				{/* header */}
				{view === "list" && columns.length > 0 && (
					<div className="mb-2 hidden grid-cols-[1fr_repeat(var(--cols),minmax(0,1fr))_64px] items-center gap-2 font-medium text-muted-foreground text-xs md:grid">
						<span>Name</span>
						{columns.map((c) => (
							<span key={c.label} className={c.className}>
								{c.label}
							</span>
						))}
						{hasActions && <span className="text-right">Actions</span>}
					</div>
				)}
				{items.map((item) => (
					<div
						key={item.id}
						className="grid grid-cols-[1fr_repeat(var(--cols),minmax(0,1fr))_64px] items-center justify-items-start gap-2 border-border py-2 text-sm md:border-t"
					>
						<Button
							variant="secondary"
							className="flex-1 p-0 px-4 text-left"
							asChild
						>
							<Link href={href(item)}>
								<span className="truncate font-medium">
									{render ? render(item, "list") : item.name}
								</span>
							</Link>
						</Button>
						{columns.map((c) => (
							<span
								key={c.label}
								className={cn("w-full truncate", c.className)}
							>
								{c.render(item)}
							</span>
						))}
						{hasActions && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="justify-self-end"
									>
										<EllipsisVertical className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{actions?.map((a) => (
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
					</div>
				))}
			</div>
		</>
	);
}
