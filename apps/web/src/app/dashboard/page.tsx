"use client";
import { DataList, ListSkeleton } from "@/components/list";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { authClient } from "@/lib/auth-client";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { usePersistentState } from "@/utils/usePersistentState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Folder,
	FolderPlus,
	LayoutGrid,
	List as ListIcon,
	Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function Dashboard() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	const queryClient = useQueryClient();

	const projectsQuery = useQuery({
		...trpc.projects.list.queryOptions(),
		enabled: !!session,
	});

	const createProject = useMutation({
		...trpc.projects.create.mutationOptions(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: trpc.projects.list.queryKey(),
			});
		},
	});

	const updateProject = useMutation({
		...trpc.projects.update.mutationOptions(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: trpc.projects.list.queryKey(),
			});
		},
	});

	const deleteProject = useMutation({
		...trpc.projects.delete.mutationOptions(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: trpc.projects.list.queryKey(),
			});
		},
	});

	const [query, setQuery] = useState("");
	const [view, setView] = usePersistentState<"grid" | "list">(
		"ui-view",
		"grid",
	);
	const filteredProjects = (projectsQuery.data ?? []).filter(
		(p: { name: string }) => p.name.toLowerCase().includes(query.toLowerCase()),
	);

	// helper create function
	function handleCreate() {
		const name = window.prompt("Project name:");
		if (name?.trim()) {
			createProject.mutate({ name: name.trim() });
		}
	}

	// Prefetch project pages for performance
	useLayoutEffect(() => {
		for (const p of filteredProjects satisfies Array<{ id: string }>) {
			router.prefetch(`/dashboard/${p.id}`);
			// Prefetch emails list to avoid skeleton on project page
			const opts = trpc.emails.list.queryOptions({ projectId: p.id });
			queryClient.prefetchQuery(opts);
		}
	}, [filteredProjects, router, queryClient.prefetchQuery]);

	useEffect(() => {
		if (!session && !isPending) router.push("/sign-in");
	}, [session, isPending, router]);

	if (isPending || projectsQuery.isPending) {
		// Skeleton placeholder UI
		return (
			<div className="animate-pulse bg-background">
				{/* Header skeleton */}
				<div className="border-border border-b bg-background py-4 md:py-6">
					<div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
						{/* Breadcrumb */}
						<div className="flex items-center gap-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-3 w-3" />
							<Skeleton className="h-3 w-24" />
						</div>
						{/* Title and controls */}
						<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
							<Skeleton className="h-8 w-48" />
							<div className="flex gap-2">
								<Skeleton className="h-9 w-40" />
								<Skeleton className="h-9 w-32" />
							</div>
						</div>
					</div>
				</div>

				<div className="container mx-auto px-4 py-6 lg:px-6">
					<ListSkeleton rows={5} />
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background">
			{/* Header */}
			<PageHeader
				data={{ name: "Projects", type: "dashboard" }}
				subtitle="Organize your projects and emails."
				onCreate={handleCreate}
			>
				<div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
					<ToggleGroup
						type="single"
						value={view}
						onValueChange={(v) => v && setView(v as "grid" | "list")}
						variant="outline"
						className="hidden h-9 md:flex"
					>
						<ToggleGroupItem value="grid" aria-label="Grid view">
							<LayoutGrid className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="list" aria-label="List view">
							<ListIcon className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>
					<div className="relative hidden md:block">
						<Input
							type="search"
							placeholder="Search projects"
							className="pl-8"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					</div>
				</div>
			</PageHeader>

			{/* Body */}
			<div className="container mx-auto px-4 py-6 lg:px-6">
				<DataList
					items={filteredProjects}
					href={(p) => `/dashboard/${p.id}`}
					actions={[
						{
							label: "Edit",
							onSelect: (item) => {
								const newName = window.prompt("Rename project", item.name);
								if (newName?.trim()) {
									updateProject.mutate({ id: item.id, name: newName.trim() });
								}
							},
						},
						{
							label: "Delete",
							className: "text-destructive focus:text-destructive",
							onSelect: (item) => confirmDeletion(item, deleteProject.mutate),
						},
					]}
					onCreate={handleCreate}
					emptyTitle="No projects yet"
					emptyDescription="Create your first project to organize your emails."
					emptyIcon={Folder}
					createLabel="New project"
					createIcon={FolderPlus}
					columns={[
						// {
						// 	label: "Emails",
						// 	render: (item) => (item.count ?? 0).toString(),
						// },
						{
							label: "Created",
							render: (item) => new Date(item.createdAt).toLocaleDateString(),
						},
						{
							label: "Author",
							render: (item) => {
								const name = item.authorName ?? "";
								const suffix = item.userId === session?.user.id ? " (you)" : "";
								return `${name}${suffix}`;
							},
						},
					]}
					view={view}
				/>
			</div>
		</div>
	);
}
