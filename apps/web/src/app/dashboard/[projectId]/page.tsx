"use client";
import { DuplicateEmailDialog } from "@/components/duplicate-email-dialog";
import { LanguageBadge } from "@/components/language-badge";
import { DataList, ListSkeleton } from "@/components/list";
import { ManageEmailDialog } from "@/components/manage-email-dialog";
import { ManageProjectDialog } from "@/components/manage-project-dialog";
import { NewEmailDialog } from "@/components/new-email-dialog";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { authClient } from "@/lib/auth-client";
import { prompt } from "@/lib/dialogs";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { usePersistentState } from "@/utils/usePersistentState";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	LayoutGrid,
	List as ListIcon,
	Mail,
	MailPlus,
	Search,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function ProjectPage() {
	const router = useRouter();
	const params = useParams<{ projectId: string }>();
	const projectId = params.projectId;
	const { data: session, isPending } = authClient.useSession();

	const queryClient = useQueryClient();

	const emailsQuery = projectId
		? useQuery({
				...trpc.emails.list.queryOptions({ projectId }),
				enabled: !!session,
			})
		: null;

	const createEmail = useMutation(
		trpc.emails.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
			},
		}),
	);

	const manageEmail = useMutation(
		trpc.emails.manage.mutationOptions({
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

	const duplicateEmail = useMutation(
		trpc.emails.duplicate.mutationOptions({
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
	const [view, setView] = usePersistentState<"grid" | "list">(
		"ui-view",
		"grid",
	);
	const filteredEmails = (emailsQuery?.data ?? []).filter(
		(e: { name: string }) => e.name.toLowerCase().includes(query.toLowerCase()),
	);

	const [createOpen, setCreateOpen] = useState(false);
	const [duplicateSource, setDuplicateSource] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [manageSource, setManageSource] = useState<{
		id: string;
		name: string;
		description?: string | null;
	} | null>(null);
	const [duplicateOpen, setDuplicateOpen] = useState(false);
	const [manageOpen, setManageOpen] = useState(false);
	const [manageProjectOpen, setManageProjectOpen] = useState(false);

	function handleCreate(
		title: string,
		language: "html" | "jsx",
		description?: string,
	) {
		createEmail.mutate({ projectId, name: title, language, description });
	}

	// Prefetch email editor pages and their latest version data for performance
	useLayoutEffect(() => {
		for (const e of filteredEmails satisfies Array<{ id: string }>) {
			// Prefetch the route so Next.js has the bundle cached
			router.prefetch(`/dashboard/${projectId}/${e.id}`);

			// Prefetch API data needed by the email editor (latest version)
			const latestOpts = trpc.versions.getLatest.queryOptions({
				emailId: e.id,
			});
			queryClient.prefetchQuery(latestOpts);
		}
	}, [filteredEmails, projectId, router, queryClient]);

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

	if (isPending || emailsQuery?.isPending) {
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
					setManageProjectOpen(true);
				}}
				onDelete={() =>
					confirmDeletion(
						{ id: projectId, name: projectName ?? "", type: "project" },
						deleteProject.mutate,
					)
				}
				onCreate={() => setCreateOpen(true)}
			>
				<div className="contents flex-col gap-[inherit] md:flex md:flex-row md:items-center">
					<ToggleGroup
						type="single"
						value={view}
						onValueChange={(v) => v && setView(v as "grid" | "list")}
						variant="outline"
						className="order-1 flex h-9"
					>
						<ToggleGroupItem value="grid" aria-label="Grid view">
							<LayoutGrid className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="list" aria-label="List view">
							<ListIcon className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>
					<div className="relative block">
						<Input
							type="search"
							placeholder="Search emails"
							className="pl-8"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					</div>
				</div>
			</PageHeader>

			<div className="container mx-auto px-4 py-6 lg:px-6">
				<DataList
					items={filteredEmails}
					render={(e, view) => (
						<div className="flex w-full items-center justify-between gap-2">
							<div className="truncate">{e.name}</div>
							{view === "grid" && (
								<div className="flex items-center">
									<LanguageBadge
										language={e.language}
										className="max-md:hidden"
									/>
									<LanguageBadge
										language={e.language}
										badgeOnly
										className="md:hidden"
									/>
								</div>
							)}
						</div>
					)}
					href={(e) => `/dashboard/${projectId}/${e.id}`}
					actions={[
						{
							label: "Open",
							onSelect: (item) => {
								router.push(`/dashboard/${projectId}/${item.id}`);
							},
						},
						{
							label: "Manage",
							onSelect: (item) => {
								setManageSource({
									id: item.id,
									name: item.name,
									description: item.description,
								});
								setManageOpen(true);
							},
						},
						{
							label: "Duplicate",
							onSelect: (item) => {
								setDuplicateSource({ id: item.id, name: item.name });
								setDuplicateOpen(true);
							},
						},
						{
							label: "Delete",
							className: "text-destructive focus:text-destructive",
							onSelect: (item) => confirmDeletion(item, deleteEmail.mutate),
						},
					]}
					onCreate={() => setCreateOpen(true)}
					emptyTitle="No emails yet"
					emptyDescription="Create your first email for this project."
					emptyIcon={Mail}
					createLabel="New email"
					createIcon={MailPlus}
					columns={[
						{
							label: "Language",
							render: (item) => <LanguageBadge language={item.language} />,
						},
						{
							label: "Description",
							render: (item) => item.description,
							dataCardProperty: "description",
						},
						{
							label: "Created",
							render: (item) => new Date(item.createdAt).toLocaleDateString(),
							dataCardProperty: "detail",
						},
						{
							label: "Author",
							render: (item) => {
								const name = item.authorName ?? "";
								// const suffix = item.userId === session?.user.id ? " (you)" : "";
								// return `${name}${suffix}`;
								return name;
							},
							dataCardProperty: "detailLabel",
						},
					]}
					view={view}
				/>
			</div>

			<NewEmailDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreate={handleCreate}
			/>

			{duplicateSource && (
				<DuplicateEmailDialog
					open={duplicateOpen}
					onOpenChange={setDuplicateOpen}
					originalName={duplicateSource.name as string}
					onDuplicate={(opts) => {
						duplicateEmail.mutate({
							sourceEmailId: duplicateSource.id,
							projectId,
							name: opts.name,
							description: opts.description,
							copyAllVersions: opts.copyAll,
						});
					}}
				/>
			)}

			{manageSource && (
				<ManageEmailDialog
					open={manageOpen}
					onOpenChange={setManageOpen}
					initialName={manageSource.name}
					initialDescription={manageSource.description}
					onSave={(opts) => {
						manageEmail.mutate({
							id: manageSource.id,
							name: opts.name,
							description: opts.description,
						});
					}}
				/>
			)}

			<ManageProjectDialog
				open={manageProjectOpen}
				onOpenChange={setManageProjectOpen}
				initialName={projectName ?? ""}
				onSave={(opts) => {
					updateProject.mutate({
						id: projectId,
						name: opts.name,
						description: opts.description,
					});
				}}
			/>
		</div>
	);
}
