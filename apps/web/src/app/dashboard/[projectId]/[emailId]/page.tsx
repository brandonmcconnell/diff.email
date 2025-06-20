"use client";
import { EditorPane } from "@/components/editor/EditorPane";
import { PreviewPane } from "@/components/editor/PreviewPane";
import { Toolbar } from "@/components/editor/Toolbar";
import { LanguageBadge } from "@/components/language-badge";
import { PageHeader } from "@/components/page-header";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionHistoryDialog } from "@/components/version-history-dialog";
import { prompt } from "@/lib/dialogs";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { usePersistentState } from "@/utils/usePersistentState";
import type { Client, Engine } from "@diff-email/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

	const [isReady, setIsReady] = useState(false);
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
	const [consoleVisible, setConsoleVisible] = useState(false);
	const [consoleLogs, setConsoleLogs] = useState<
		Array<{
			data: string[];
			method: "error" | "warn";
		}>
	>([]);

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
	const htmlRef = useRef<string>("");
	const [files, setFiles] = useState<Record<string, string> | undefined>();
	const filesRef = useRef<Record<string, string> | undefined>(undefined);
	const [entry, setEntry] = useState<string | undefined>();

	// Track last saved snapshot for dirty detection
	const [lastSavedHtml, setLastSavedHtml] = useState<string>("");
	const [lastSavedFiles, setLastSavedFiles] = useState<
		Record<string, string> | undefined
	>();
	const [saveCounter, setSaveCounter] = useState(0);

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
			if (latestQuery.isSuccess) setIsReady(true);
			const initialHtml = latestQuery.data.html ?? "";
			setHtml(initialHtml);
			htmlRef.current = initialHtml;
			setLastSavedHtml(initialHtml);
		} else if (latestQuery.data.files) {
			if (latestQuery.isSuccess) setIsReady(true);
			const initialFiles = latestQuery.data.files as Record<string, string>;
			setFiles(initialFiles);
			filesRef.current = initialFiles;
			setLastSavedFiles(initialFiles);
			setEntry("index.tsx");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language, latestQuery.data, latestQuery.isSuccess]);

	function handleSave() {
		if (language === "html") {
			const currentHtml = htmlRef.current;
			versionsSave.mutate(
				{ emailId, html: currentHtml },
				{
					onSuccess: () => {
						toast.success("Version saved");
						setLastSavedHtml(currentHtml);
						setSaveCounter((c) => c + 1);
					},
				},
			);
		} else if (filesRef.current && Object.keys(filesRef.current).length) {
			const currentFiles = filesRef.current;
			versionsSave.mutate(
				{ emailId, files: currentFiles },
				{
					onSuccess: () => {
						toast.success("Version saved");
						setLastSavedFiles(currentFiles);
						setSaveCounter((c) => c + 1);
					},
				},
			);
		}
	}

	function handleRun() {
		// TODO run screenshots via trpc.runs.create
	}

	// Determine dirty state
	const isDirty =
		language === "html"
			? html !== lastSavedHtml
			: JSON.stringify(files ?? {}) !== JSON.stringify(lastSavedFiles ?? {});

	// Show skeleton placeholder while queries are loading to avoid flashing incomplete header content
	if (emailsQuery?.isPending || latestQuery.isPending) {
		return (
			<div className="animate-pulse bg-background">
				{/* Header skeleton */}
				<div className="border-border border-b bg-background py-4 md:py-6">
					<div className="container mx-auto flex flex-col gap-6 px-4 lg:px-6">
						{/* Breadcrumb */}
						<div className="flex items-center gap-2">
							<Skeleton className="h-3 w-16" />
							<Skeleton className="h-3 w-3" />
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-3" />
							<Skeleton className="h-3 w-24" />
						</div>
						{/* Title and controls */}
						<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
							<div className="flex items-center gap-2">
								<Skeleton className="h-8 w-64" />
								<Skeleton className="h-6 w-16" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-32" />
								<Skeleton className="h-9 w-32" />
							</div>
						</div>
					</div>
				</div>

				{/* Body skeleton */}
				<div className="container mx-auto px-4 py-6 lg:px-6">
					<Skeleton className="h-[400px] w-full" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh_-_4rem)] w-full flex-col">
			<PageHeader
				data={{ id: emailId, name: emailName, projectId, type: "email" }}
				subtitle="Edit email document"
				afterTitle={<LanguageBadge language={language} size="md" />}
				onRename={async () => {
					const newTitle = await prompt({
						title: "Rename email",
						defaultValue: emailName,
					});
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
			>
				<VersionHistoryDialog emailId={emailId} versionCount={versionCount} />
			</PageHeader>
			{mounted && (
				<>
					{/* Desktop (md+) split view */}
					<div className="hidden min-h-0 flex-1 overflow-hidden rounded-t-md border-t md:flex">
						<ResizablePanelGroup
							direction="horizontal"
							className="flex flex-1 overflow-hidden rounded-t-md"
						>
							<ResizablePanel
								defaultSize={50}
								minSize={25}
								className="overflow-visible! rounded-tl-md"
							>
								{/* Render editor only when ready to avoid flash */}
								{(() => {
									if (!isReady) return null;
									return (
										<EditorPane
											value={html}
											onChange={(v) => {
												setHtml(v ?? "");
												htmlRef.current = v ?? "";
											}}
											onFilesChange={(m, e) => {
												setFiles(m);
												filesRef.current = m;
												setEntry(e);
											}}
											showSidebar={language === "jsx"}
											onSave={handleSave}
											saveCounter={saveCounter}
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
										consoleVisible={consoleVisible}
										consoleLogs={consoleLogs}
										setConsoleVisible={setConsoleVisible}
										onSave={handleSave}
										isDirty={isDirty}
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
										showConsole={consoleVisible}
										onLogsChange={setConsoleLogs}
									/>
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>

					{/* Mobile (tabs) */}
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t md:hidden">
						<Tabs
							defaultValue="editor"
							className="relative flex h-full flex-col overflow-hidden"
						>
							<TabsContent
								value="editor"
								className="flex min-h-0 flex-1 flex-col overflow-hidden"
							>
								{isReady && (
									<EditorPane
										value={html}
										onChange={(v) => {
											setHtml(v ?? "");
											htmlRef.current = v ?? "";
										}}
										onFilesChange={(m, e) => {
											setFiles(m);
											filesRef.current = m;
											setEntry(e);
										}}
										showSidebar={language === "jsx"}
										onSave={handleSave}
										saveCounter={saveCounter}
										{...(files
											? { initialFiles: files, initialEntry: entry }
											: {})}
									/>
								)}
							</TabsContent>
							<TabsContent
								value="preview"
								className="flex min-h-0 flex-1 flex-col overflow-hidden"
							>
								<PreviewPane
									html={html}
									files={files}
									entry={entry}
									engine={engine}
									client={client}
									mode={mode}
									dark={dark}
									showConsole={consoleVisible}
									onLogsChange={setConsoleLogs}
								/>
							</TabsContent>

							{/* Floating tab buttons bottom-right */}
							<TabsList className="fixed right-2 bottom-12 flex gap-1 rounded-lg bg-muted p-1 shadow-lg backdrop-blur max-md:bottom-[calc(env(safe-area-inset-bottom)+--spacing(12))]!">
								<TabsTrigger value="editor">Code</TabsTrigger>
								<TabsTrigger value="preview">Preview</TabsTrigger>
							</TabsList>
						</Tabs>

						{/* Toolbar at very bottom */}
						<Toolbar
							engine={engine}
							setEngine={setEngine}
							client={client}
							setClient={setClient}
							mode={mode}
							setMode={setMode}
							dark={dark}
							setDark={setDark}
							consoleVisible={consoleVisible}
							consoleLogs={consoleLogs}
							setConsoleVisible={setConsoleVisible}
							onSave={handleSave}
							isDirty={isDirty}
							onRun={handleRun}
						/>
					</div>
				</>
			)}
		</div>
	);
}
