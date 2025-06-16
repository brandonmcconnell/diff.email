"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

	const [title, setTitle] = useState("");

	useEffect(() => {
		if (!session && !isPending) router.push("/login");
	}, [session, isPending, router]);

	if (isPending || emailsQuery.isPending)
		return <div className="p-4">Loading…</div>;

	return (
		<div className="mx-auto max-w-3xl p-4">
			<Button
				type="button"
				variant="link"
				className="mb-4 text-sm"
				onClick={() => router.push("/dashboard")}
			>
				{"< Back"}
			</Button>
			<h1 className="mb-4 font-semibold text-2xl">Emails</h1>

			<ul className="space-y-2">
				{emailsQuery.data?.map((e: { id: string; title: string }) => (
					<li key={e.id}>
						<Button
							type="button"
							variant="outline"
							className="w-full justify-start"
							onClick={() => router.push(`/dashboard/${projectId}/${e.id}`)}
						>
							{e.title}
						</Button>
					</li>
				))}
			</ul>

			<div className="mt-6 flex gap-2">
				<input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="New email title"
					className="flex-1 rounded border px-3 py-2"
				/>
				<Button
					disabled={!title.trim() || createEmail.isPending}
					onClick={() => {
						createEmail.mutate({ projectId, title: title.trim() });
						setTitle("");
					}}
				>
					Create
				</Button>
			</div>
		</div>
	);
}
