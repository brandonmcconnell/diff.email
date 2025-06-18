"use client";
import { DataList, ListSkeleton } from "@/components/list";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailPlus, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function ProjectPage() {
	const router = useRouter();
	const params = useParams<{ projectId: string }>();
	const projectId = params.projectId;
	const { data: session, isPending } = authClient.useSession();

	const queryClient = useQueryClient();

	const emailsQuery = useQuery({
		...trpc.emails.list.queryOptions({ projectId }),
		enabled: !!session,
	});

	const createEmail = useMutation(
		trpc.emails.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
			},
		}),
	);

	const updateEmail = useMutation(
		trpc.emails.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
			},
		}),
	);

	const deleteEmail = useMutation(
		trpc.emails.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
			},
		}),
	);

	const projectsQuery = useQuery({
		...trpc.projects.list.queryOptions(),
		enabled: !!session,
	});
	const projectName = (projectsQuery.data ?? []).find(
		(pr: { id: string; name: string }) => pr.id === projectId,
	)?.name;

	const [query, setQuery] = useState("");
	const filteredEmails = (emailsQuery.data ?? []).filter(
		(e: { name: string }) => e.name.toLowerCase().includes(query.toLowerCase()),
	);

	// helper create function
	function handleCreate() {
		const name = window.prompt("Email title");
		if (name?.trim()) {
			createEmail.mutate({ projectId, name: name.trim() });
		}
	}

	// Prefetch email editor pages for performance
	useLayoutEffect(() => {
		for (const e of filteredEmails satisfies Array<{ id: string }>) {
			router.prefetch(`/dashboard/${projectId}/${e.id}`);
		}
	}, [filteredEmails, projectId, router]);

	// Mutations for the project itself
	const updateProject = useMutation(
		trpc.projects.update.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: trpc.projects.list.queryKey(),
				});
			},
		}),
	);

	const deleteProject = useMutation(
		trpc.projects.delete.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: trpc.projects.list.queryKey(),
				});
			},
		}),
	);

	useEffect(() => {
		if (!session && !isPending) router.push("/sign-in");
	}, [session, isPending, router]);

	if (isPending || emailsQuery.isPending) {
		return (
			<div className="animate-pulse bg-background">
				{/* Header skeleton */}
				<div className="border-border border-b bg-background py-4 md:py-6">
					<div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
						<div className="flex items-center gap-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-3 w-3" />
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-3" />
							<Skeleton className="h-3 w-24" />
						</div>
						<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
							<Skeleton className="h-8 w-64" />
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
			<PageHeader
				data={{ id: projectId, name: projectName ?? "", type: "project" }}
				subtitle="Manage versioned email documents for this project."
				onRename={() => {
					const newName = window.prompt("Rename project", projectName ?? "");
					if (newName?.trim()) {
						updateProject.mutate({ id: projectId, name: newName.trim() });
					}
				}}
				onDelete={() =>
					confirmDeletion(
						{ id: projectId, name: projectName ?? "", type: "project" },
						deleteProject.mutate,
					)
				}
				onCreate={handleCreate}
			>
				<div className="relative hidden md:block">
					<Input
						type="search"
						placeholder="Search emails"
						className="pl-8"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
				</div>
			</PageHeader>

			<div className="container mx-auto px-4 py-6 lg:px-6">
				<DataList
					items={filteredEmails}
					href={(e) => `/dashboard/${projectId}/${e.id}`}
					actions={[
						{
							label: "Edit",
							onSelect: (item) => {
								const newTitle = window.prompt("Rename email", item.name);
								if (newTitle?.trim()) {
									updateEmail.mutate({ id: item.id, name: newTitle.trim() });
								}
							},
						},
						{
							label: "Delete",
							className: "text-destructive focus:text-destructive",
							onSelect: (item) => confirmDeletion(item, deleteEmail.mutate),
						},
					]}
					onCreate={handleCreate}
					emptyTitle="No emails yet"
					emptyDescription="Create your first email for this project."
					emptyIcon={Mail}
					createLabel="New email"
					createIcon={MailPlus}
					columns={[
						// {
						// 	label: "Versions",
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
								// const suffix = item.userId === session?.user.id ? " (you)" : "";
								// return `${name}${suffix}`;
								return name;
							},
						},
					]}
				/>
			</div>
		</div>
	);
}
