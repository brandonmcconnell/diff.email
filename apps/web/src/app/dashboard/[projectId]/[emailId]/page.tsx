"use client";
import { EditorPane } from "@/components/editor/EditorPane";
import { PreviewPane } from "@/components/editor/PreviewPane";
import { Toolbar } from "@/components/editor/Toolbar";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { useEffect, useState } from "react";

export default function EmailEditorPage() {
	const params = useParams<{ projectId: string; emailId: string }>();
	const projectId = params.projectId;
	const emailId = params.emailId;

	const router = useRouter();

	const queryClient = useQueryClient();

	const emailsQuery = projectId
		? useQuery({
				...trpc.emails.list.queryOptions({ projectId }),
				enabled: !!projectId,
			})
		: null;
	const emailData = emailsQuery?.data?.find(
		(e: { id: string }) => e.id === emailId,
	);
	const emailName = emailData?.name ?? "";
	const language = emailData?.language ?? "html";
	const versionCount = emailData?.count ?? 0;

	// persistent UI state
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

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

	const [html, setHtml] = useState<string>("<!-- start editing -->");
	const [files, setFiles] = useState<Record<string, string> | undefined>();
	const [entry, setEntry] = useState<string | undefined>();

	// Seed when language resolved and no versions yet
	useEffect(() => {
		if (versionCount !== 0) return;
		if (language === "jsx" && !files) {
			const starter =
				"export default function Email() {\n  return <p>Hello world!</p>;\n}";
			setFiles({ "index.tsx": starter });
			setEntry("index.tsx");
			setHtml("");
		}
		if (language === "html" && html === "<!-- start editing -->") {
			setHtml(
				`<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>${emailName}</title>\n  </head>\n  <body>\n    <!-- start editing -->\n  </body>\n</html>`,
			);
		}
	}, [language, versionCount, files, html, emailName]);

	return (
		<div className="flex h-[calc(100vh_-_3rem)] w-full flex-col">
			<PageHeader
				data={{ id: emailId, name: emailName, projectId, type: "email" }}
				subtitle="Edit email document"
				afterTitle={<Badge variant="secondary">{language.toUpperCase()}</Badge>}
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
			{mounted && (
				<ResizablePanelGroup direction="horizontal" className="flex-1 border-t">
					<ResizablePanel defaultSize={50} minSize={25}>
						<EditorPane
							value={html}
							onChange={(v) => setHtml(v ?? "")}
							onFilesChange={(m, e) => {
								setFiles(m);
								setEntry(e);
							}}
							showSidebar={language === "jsx"}
							initialFiles={files}
							initialEntry={entry}
						/>
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
								files={files}
								entry={entry}
								engine={engine}
								client={client}
								mode={mode}
								dark={dark}
							/>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</div>
	);
}
