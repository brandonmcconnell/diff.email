"use client";
import { EditorPane } from "@/components/editor/EditorPane";
import { PreviewPane } from "@/components/editor/PreviewPane";
import { Toolbar } from "@/components/editor/Toolbar";
import { PageHeader } from "@/components/page-header";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { usePersistentState } from "@/utils/usePersistentState";
import type { Client, Engine } from "@diff-email/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function EmailEditorPage() {
	const params = useParams<{ projectId: string; emailId: string }>();
	const projectId = params.projectId;
	const emailId = params.emailId;

	const router = useRouter();

	const [html, setHtml] = useState<string>("<!-- start editing -->");

	// persistent UI state
	const [engine, setEngine] = usePersistentState<Engine>(
		"ui-engine",
		"chromium",
	);
	const [client, setClient] = usePersistentState<Client>("ui-client", "gmail");
	const [mode, setMode] = usePersistentState<"live" | "screenshot">(
		"ui-mode",
		"live",
	);
	const [dark, setDark] = usePersistentState<boolean>("ui-dark", false);

	const queryClient = useQueryClient();

	// Fetch email list to get current email name
	const emailsQuery = useQuery({
		...trpc.emails.list.queryOptions({ projectId }),
		enabled: !!projectId,
	});
	const emailName =
		emailsQuery.data?.find(
			(e: { id: string; name: string }) => e.id === emailId,
		)?.name ?? "";

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
				// Invalidate email list and navigate back to project page
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
				router.push(`/dashboard/${projectId}`);
			},
		}),
	);

	return (
		<div className="flex h-[calc(100vh_-_3rem)] w-full flex-col">
			<PageHeader
				data={{ id: emailId, name: emailName, projectId, type: "email" }}
				subtitle="Edit email document"
				onRename={() => {
					const newTitle = window.prompt("Rename email", emailName);
					if (newTitle?.trim()) {
						updateEmail.mutate({ id: emailId, name: newTitle.trim() });
					}
				}}
				onDelete={() =>
					confirmDeletion(
						{ id: emailId, name: emailName, type: "email" },
						deleteEmail.mutate,
					)
				}
			/>
			<ResizablePanelGroup direction="horizontal" className="flex-1 border-t">
				<ResizablePanel defaultSize={50} minSize={25}>
					<EditorPane value={html} onChange={(v) => setHtml(v ?? "")} />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={50} minSize={25}>
					<div className="flex h-full flex-col">
						<Toolbar
							engine={engine}
							setEngine={setEngine}
							client={client}
							setClient={setClient}
							mode={mode}
							setMode={setMode}
							dark={dark}
							setDark={setDark}
						/>
						<PreviewPane
							html={html}
							engine={engine}
							client={client}
							mode={mode}
							dark={dark}
						/>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
