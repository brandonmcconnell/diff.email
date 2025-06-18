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
import { toast } from "sonner";

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

	const [html, setHtml] = useState<string>("");
	const [files, setFiles] = useState<Record<string, string> | undefined>();
	const [entry, setEntry] = useState<string | undefined>();

	const latestQuery = useQuery({
		...trpc.versions.getLatest.queryOptions({ emailId }),
		enabled: !!emailId,
	});

	const versionsSave = useMutation(
		trpc.versions.save.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.versions.getLatest.queryKey({ emailId }),
				});
			},
		}),
	);

	useEffect(() => {
		if (!latestQuery.data) return;
		if (language === "html") {
			setHtml(latestQuery.data.html ?? "");
		} else if (latestQuery.data.files) {
			setFiles(latestQuery.data.files as Record<string, string>);
			setEntry("index.tsx");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language, latestQuery.data]);

	function handleSave() {
		if (language === "html") {
			versionsSave.mutate(
				{ emailId, html },
				{ onSuccess: () => toast.success("Version saved") },
			);
		} else if (files && Object.keys(files).length) {
			versionsSave.mutate(
				{ emailId, files },
				{ onSuccess: () => toast.success("Version saved") },
			);
		}
	}

	function handleRun() {
		// TODO run screenshots via trpc.runs.create
	}

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
						{/* Render editor only when ready to avoid flash */}
						{(() => {
							const ready =
								language === "html" ? latestQuery.isSuccess : !!files;
							if (!ready) return null;
							return (
								<EditorPane
									value={html}
									onChange={(v) => setHtml(v ?? "")}
									onFilesChange={(m, e) => {
										setFiles(m);
										setEntry(e);
									}}
									showSidebar={language === "jsx"}
									{...(files
										? { initialFiles: files, initialEntry: entry }
										: {})}
								/>
							);
						})()}
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
								onSave={handleSave}
								onRun={handleRun}
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
