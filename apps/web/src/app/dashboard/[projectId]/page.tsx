"use client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

				{/* List skeleton */}
				<div className="container mx-auto space-y-2 px-4 py-6 lg:px-6">
					{Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: allowed for skeleton
						<Skeleton key={i} className="h-10 w-full" />
					))}
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
				onCreate={() => {
					const name = window.prompt("Email title");
					if (name?.trim()) {
						createEmail.mutate({ projectId, name: name.trim() });
					}
				}}
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
				{filteredEmails.length === 0 ? (
					<div className="flex flex-col items-center gap-6 rounded-md border border-border border-dashed p-6 text-center">
						<p className="text-muted-foreground text-sm">No emails found</p>
					</div>
				) : (
					<ul className="space-y-2">
						{filteredEmails.map(
							(e: {
								id: string;
								name: string;
								count?: number;
								type: "email";
							}) => (
								<li
									key={e.id}
									className="flex items-center justify-between gap-2"
								>
									<Button
										variant="outline"
										className="flex-1 justify-start"
										asChild
									>
										<Link href={`/dashboard/${projectId}/${e.id}`}>
											{e.name}
										</Link>
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="icon">
												<EllipsisVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onSelect={() => {
													const newTitle = window.prompt(
														"Rename email",
														e.name,
													);
													if (newTitle?.trim()) {
														updateEmail.mutate({
															id: e.id,
															name: newTitle.trim(),
														});
													}
												}}
											>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onSelect={() => confirmDeletion(e, deleteEmail.mutate)}
											>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</li>
							),
						)}
					</ul>
				)}
			</div>
		</div>
	);
}
