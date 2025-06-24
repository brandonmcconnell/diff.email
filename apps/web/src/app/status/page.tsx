"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

const TITLE_TEXT = "API Status";

export default function StatusPage() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<h1 className="mb-6 text-center font-bold font-mono text-2xl">
				{TITLE_TEXT}
			</h1>
			<section className="rounded-lg border p-4">
				<h2 className="mb-2 font-medium">API</h2>
				<div className="flex items-center gap-2">
					<div
						className={`h-3 w-3 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
					/>
					<span className="text-muted-foreground text-sm">
						{healthCheck.isLoading
							? "Checking..."
							: healthCheck.data
								? "Connected"
								: "Disconnected"}
					</span>
				</div>
			</section>
		</div>
	);
}
