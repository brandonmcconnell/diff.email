"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisVertical, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
	const filteredProjects = (projectsQuery.data ?? []).filter(
		(p: { name: string }) => p.name.toLowerCase().includes(query.toLowerCase()),
	);

	const [creating, setCreating] = useState(false);

	function handleCreate() {
		const name = window.prompt("Project name:");
		if (name?.trim()) {
			createProject.mutate({ name: name.trim() });
		}
	}

	useEffect(() => {
		if (!session && !isPending) router.push("/sign-in");
	}, [session, isPending, router]);

	if (isPending || projectsQuery.isPending)
		return (
			<div className="bg-background">
				<div className="container mx-auto flex flex-col gap-6 px-4 pt-4 md:pt-6 lg:px-6">
					<div className="p-4">Loading…</div>
				</div>
			</div>
		);

	return (
		<div className="bg-background">
			<div className="container mx-auto flex flex-col gap-6 px-4 pt-4 md:pt-6 lg:px-6">
				{/* Header */}
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
					<div className="space-y-1">
						<h2 className="font-semibold text-xl">Projects</h2>
						<p className="text-muted-foreground text-sm">
							Organize your projects and emails.
						</p>
					</div>

					{/* Search & Actions */}
					<div className="flex flex-col-reverse gap-3 md:flex-row">
						<div className="relative">
							<Input
								type="search"
								placeholder="Search projects"
								className="pl-8"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						</div>
						<div className="flex flex-row-reverse justify-end gap-2 md:flex-row">
							<Button onClick={handleCreate}>Create new</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="container mx-auto px-4 py-6 lg:px-6">
				{filteredProjects.length === 0 ? (
					<div className="flex flex-col items-center gap-6 rounded-md border border-border border-dashed p-6 text-center">
						<p className="text-muted-foreground text-sm">No projects found</p>
					</div>
				) : (
					<ul className="space-y-2">
						{filteredProjects.map(
							(p: {
								id: string;
								name: string;
								count?: number;
								type: "project";
							}) => (
								<li
									key={p.id}
									className="flex items-center justify-between gap-2"
								>
									<Button
										variant="outline"
										className="flex-1 justify-start"
										onClick={() => router.push(`/dashboard/${p.id}`)}
									>
										{p.name}
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
													const newName = window.prompt(
														"Rename project",
														p.name,
													);
													if (newName?.trim()) {
														updateProject.mutate({
															id: p.id,
															name: newName.trim(),
														});
													}
												}}
											>
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onSelect={() =>
													confirmDeletion(p, deleteProject.mutate)
												}
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
