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
	MailPlus,
	Plus,
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
				<Link href="/dashboard">Dashboard</Link>
			</BreadcrumbLink>
		</BreadcrumbItem>,
	];

	const createButtonIcon =
		data.type === "project" ? <MailPlus /> : <FolderPlus />;
	const createButtonText = data.type === "project" ? "email" : "project";
	const createButton = (
		<Button onClick={onCreate}>
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
				"border-border border-b bg-background py-4 md:py-6",
				"bg-linear-to-b from-background to-[color-mix(in_srgb,var(--background)_90%,transparent)]",
				className,
			)}
		>
			<div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
				<div className="flex h-5 items-center justify-between gap-2 overflow-visible">
					<Breadcrumb>
						<BreadcrumbList>{crumbs}</BreadcrumbList>
					</Breadcrumb>
					{children}
				</div>

				<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
					<div className="space-y-2">
						<h1 className="flex items-center gap-2 font-bold text-2xl tracking-tight md:text-3xl">
							<span>{data.name}</span>
							{afterTitle}
						</h1>
						{subtitle && (
							<p className="text-muted-foreground text-sm lg:text-base">
								{subtitle}
							</p>
						)}
					</div>
					<div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
						{(onRename || onDelete) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline">Edit</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onRename && (
										<DropdownMenuItem onSelect={onRename}>
											Rename
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
