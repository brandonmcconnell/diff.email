"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
	Check,
	ChevronsUpDown,
	FolderPlus,
	Home,
	MailPlus,
	Plus,
	Settings2,
	Slash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";

export type DashboardHeader = { name: string; type: "dashboard" };
export type ProjectHeader = { id: string; name: string; type: "project" };
export type EmailHeader = {
	id: string;
	name: string;
	projectId: string;
	type: "email";
};
export type HeaderData = DashboardHeader | ProjectHeader | EmailHeader;

interface Props {
	data: { id: string; name: string; projectId?: string; type: string };
	subtitle?: string;
	onRename?: () => void;
	onDelete?: () => void;
	onCreate?: () => void;
	afterTitle?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

export function PageHeader({
	data,
	subtitle,
	onRename,
	onDelete,
	onCreate,
	afterTitle,
	children,
	className,
}: Props) {
	// Always fetch projects so we can render the project switcher—even on project pages.
	const projectsQuery = useQuery({
		...trpc.projects.list.queryOptions(),
		enabled: data.type !== "dashboard",
	});

	const emailsQuery = useQuery({
		...trpc.emails.list.queryOptions({
			projectId: data.type === "email" ? (data.projectId ?? "") : "",
		}),
		enabled: data.type === "email",
	});

	function SlashSep() {
		return (
			<BreadcrumbSeparator>
				<Slash className="h-4 w-4 text-muted-foreground" />
			</BreadcrumbSeparator>
		);
	}

	// Build breadcrumbs
	const crumbs: React.ReactNode[] = [
		<BreadcrumbItem key="home">
			<BreadcrumbLink asChild>
				<Link href="/dashboard" className="flex items-center gap-1">
					{/* Show house icon on screens smaller than md */}
					<Home className="size-4 md:hidden" aria-label="Dashboard" />
					{/* Show text on md and larger */}
					<span className="max-md:hidden">Dashboard</span>
				</Link>
			</BreadcrumbLink>
		</BreadcrumbItem>,
	];

	const createButtonIcon =
		data.type === "project" ? <MailPlus /> : <FolderPlus />;
	const createButtonText = data.type === "project" ? "email" : "project";
	const createButton = (
		<Button
			onClick={onCreate}
			className={cn(
				"max-md:fixed max-md:right-4 max-md:bottom-4 max-md:rounded-full",
				"max-md:origin-bottom-right max-md:scale-115",
			)}
		>
			{createButtonIcon} New {createButtonText}
		</Button>
	);

	if (data.type === "project" || data.type === "email") {
		// Current project id depends on context
		const currentProjectId = data.type === "project" ? data.id : data.projectId;
		const currentProjectName =
			data.type === "project"
				? data.name
				: projectsQuery.data?.find(
						(p: { id: string; name: string }) => p.id === currentProjectId,
					)?.name || "Projects";

		const projectCrumb = (
			<BreadcrumbItem key="project">
				<div className="flex items-center gap-1">
					<BreadcrumbLink asChild>
						<Link href={`/dashboard/${currentProjectId}`}>
							{currentProjectName}
						</Link>
					</BreadcrumbLink>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="rounded! h-auto w-auto px-0 py-0.5 hover:bg-foreground/15!"
							>
								<ChevronsUpDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{projectsQuery.data?.map((p: { id: string; name: string }) => (
								<DropdownMenuItem
									key={p.id}
									className={cn(p.id === currentProjectId && "font-semibold")}
									asChild
								>
									<Link href={`/dashboard/${p.id}`}>
										{p.name}
										{p.id === currentProjectId && (
											<Check className="ml-auto text-foreground" />
										)}
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</BreadcrumbItem>
		);
		crumbs.push(<SlashSep key="s1" />, projectCrumb);
	}

	if (data.type === "email") {
		crumbs.push(
			<SlashSep key="s2" />,
			<BreadcrumbItem key="email">
				<div className="flex items-center gap-1">
					<BreadcrumbLink asChild>
						<Link href={`/dashboard/${data.projectId}/${data.id}`}>
							{data.name}
						</Link>
					</BreadcrumbLink>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="rounded! h-auto w-auto px-0 py-0.5 hover:bg-foreground/15!"
							>
								<ChevronsUpDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{emailsQuery.data?.map((e: { id: string; name: string }) => (
								<DropdownMenuItem
									key={e.id}
									className={cn(e.id === data.id && "font-semibold")}
									asChild
								>
									<Link href={`/dashboard/${data.projectId}/${e.id}`}>
										{e.name}
										{e.id === data.id && (
											<Check className="ml-auto text-foreground" />
										)}
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</BreadcrumbItem>,
		);
	}

	return (
		<div
			className={cn(
				"page-header isolate z-1",
				"relative border-border border-b bg-background py-4 md:py-6",
				"bg-linear-to-b from-background to-[color-mix(in_srgb,var(--background)_90%,transparent)]",
				className,
			)}
		>
			<div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
				{/* Two-column layout (stacks on < md) */}
				<div className="flex flex-col gap-6 md:flex-row">
					{/* Left column – breadcrumbs + title */}
					<div className="flex flex-1 flex-col gap-4">
						{/* Breadcrumbs */}
						<div className="flex h-5 items-center gap-2 overflow-visible">
							<Breadcrumb>
								<BreadcrumbList>{crumbs}</BreadcrumbList>
							</Breadcrumb>
						</div>

						{/* Title / subtitle */}
						<div className="space-y-2">
							<h1 className="block font-bold text-2xl tracking-tight md:text-3xl">
								<span>{data.name}</span>
								{afterTitle && " "}
								{afterTitle}
							</h1>
							{subtitle && (
								<p className="text-muted-foreground text-sm lg:text-base">
									{subtitle}
								</p>
							)}
						</div>
					</div>

					{/* Right column – version history dialog & actions */}
					<div className="flex justify-start gap-2 md:w-fit md:flex-none md:flex-col md:items-end md:gap-4">
						{/* Children (e.g., VersionHistoryDialog) */}
						{children}

						{/* Action buttons */}
						<div className="contents flex-row-reverse gap-[inherit] md:flex md:w-full">
							{(onRename || onDelete) && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<div>
											<Button variant="outline" className="max-md:hidden">
												Manage
											</Button>
											<Button
												variant="outline"
												size="icon"
												className="md:hidden"
												title="Manage"
											>
												<Settings2 aria-label="Manage" />
											</Button>
										</div>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{onRename && (
											<DropdownMenuItem onSelect={onRename}>
												Manage
											</DropdownMenuItem>
										)}
										{onDelete && (
											<DropdownMenuItem
												className="text-destructive"
												onSelect={onDelete}
											>
												Delete
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
							{onCreate && createButton}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Helper to build breadcrumbs with Slash separator
export function BreadcrumbSlash({ children }: { children: React.ReactNode }) {
	return (
		<>
			<BreadcrumbSeparator>
				<Slash className="h-4 w-4 text-muted-foreground" />
			</BreadcrumbSeparator>
			{children}
		</>
	);
}
