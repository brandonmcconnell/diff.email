"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

	const [name, setName] = useState("");

	useEffect(() => {
		if (!session && !isPending) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	if (isPending || projectsQuery.isPending) {
		return <div className="p-4">Loading…</div>;
	}

	return (
		<div className="mx-auto max-w-3xl p-4">
			<h1 className="mb-4 font-semibold text-2xl">Projects</h1>

			<ul className="space-y-2">
				{projectsQuery.data?.map((p: { id: string; name: string }) => (
					<li key={p.id}>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-start"
							onClick={() => router.push(`/dashboard/${p.id}`)}
						>
							{p.name}
						</Button>
					</li>
				))}
			</ul>

			<div className="mt-6 flex gap-2">
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="New project name"
					className="flex-1 rounded border px-3 py-2"
				/>
				<Button
					disabled={!name.trim() || createProject.isPending}
					onClick={() => {
						createProject.mutate({ name: name.trim() });
						setName("");
					}}
				>
					Create
				</Button>
			</div>
		</div>
	);
}
