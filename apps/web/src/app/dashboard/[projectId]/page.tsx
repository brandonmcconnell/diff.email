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

	function handleCreate() {
		const name = window.prompt("Email title");
		if (name?.trim()) {
			createEmail.mutate({ projectId, name: name.trim() });
		}
	}

	useEffect(() => {
		if (!session && !isPending) router.push("/sign-in");
	}, [session, isPending, router]);

	if (isPending || emailsQuery.isPending)
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
				<Button
					variant="link"
					className="mb-2 w-fit px-0 text-sm"
					onClick={() => router.push("/dashboard")}
				>
					&lt; Back
				</Button>
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
					<div className="space-y-1">
						<h2 className="font-semibold text-xl">Emails</h2>
						<p className="text-muted-foreground text-sm">
							Manage versioned email documents for this project.
						</p>
					</div>

					<div className="flex flex-col-reverse gap-3 md:flex-row">
						<div className="relative">
							<Input
								type="search"
								placeholder="Search emails"
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
										onClick={() =>
											router.push(`/dashboard/${projectId}/${e.id}`)
										}
									>
										{e.name}
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
