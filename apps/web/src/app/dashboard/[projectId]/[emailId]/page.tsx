"use client";
import type { Client, Engine } from "@diff-email/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleFadingArrowUp, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EditorPane } from "@/components/editor/EditorPane";
import type { ConsoleMethod } from "@/components/editor/PreviewPane";
import { PreviewPane } from "@/components/editor/PreviewPane";
import { Toolbar } from "@/components/editor/Toolbar";
import { LanguageBadge } from "@/components/language-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type ReadOnlyVersion,
	VersionHistoryDialog,
} from "@/components/version-history-dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { prompt } from "@/lib/dialogs";
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { usePersistentState } from "@/utils/usePersistentState";

export default function EmailEditorPage() {
	const { isPending } = useRequireAuth();

	const params = useParams<{ projectId: string; emailId: string }>();
	const projectId = params.projectId;
	const emailId = params.emailId;

	const router = useRouter();

	const queryClient = useQueryClient();

	const projectIdInput = projectId ?? "00000000-0000-0000-0000-000000000000";
	const emailsQuery = useQuery({
		...trpc.emails.list.queryOptions({ projectId: projectIdInput }),
		enabled: !!projectId,
	});
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
	// Use non-persistent state so each new editor session starts in live preview mode.
	const [mode, setMode] = useState<"live" | "screenshot">("live");
	const [dark, setDark] = usePersistentState<boolean>("ui-dark", false);
	const [consoleVisible, setConsoleVisible] = useState(false);
	const [consoleLogs, setConsoleLogs] = useState<
		Array<{
			data: string[];
			method: ConsoleMethod;
		}>
	>([]);

	// Determine current viewport ≥ md (768px)
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const manageEmail = useMutation(
		trpc.emails.manage.mutationOptions({
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
	const [exportName, setExportName] = useState<string>("default");

	// Track last saved snapshot for dirty detection
	const [lastSavedHtml, setLastSavedHtml] = useState<string>("");
	const [lastSavedFiles, setLastSavedFiles] = useState<
		Record<string, string> | undefined
	>();
	const [saveCounter, setSaveCounter] = useState(0);

	// Track last saved entry/export for dirty detection
	const [lastSavedEntry, setLastSavedEntry] = useState<string | undefined>();
	const [lastSavedExport, setLastSavedExport] = useState<string>("default");

	// Ref holding the latest compiled HTML when editing JSX emails
	const compiledHtmlRef = useRef<string>("");

	// Callback to receive compiled HTML from the PreviewPane
	const handleCompiledHtml = useCallback((compiled: string): void => {
		compiledHtmlRef.current = compiled;
	}, []);

	const latestQuery = useQuery({
		...trpc.versions.getLatest.queryOptions({ emailId }),
		enabled: !!emailId,
	});

	const versionsSave = useMutation(
		trpc.versions.save.mutationOptions({
			onSuccess: () => {
				// Refresh latest version, full history, and email counts
				queryClient.invalidateQueries({
					queryKey: trpc.versions.getLatest.queryKey({ emailId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.versions.list.queryKey({ emailId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.emails.list.queryKey({ projectId }),
				});
			},
		}),
	);

	// State for read-only viewing of historical versions
	const [readOnlyVersion, setReadOnlyVersion] =
		useState<ReadOnlyVersion | null>(null);

	const isReadOnly = readOnlyVersion !== null;

	// Determine current version ID for screenshot operations
	const currentVersionId = (readOnlyVersion?.id ??
		latestQuery.data?.id ??
		"") as string;

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
			const initialEntryPath =
				(latestQuery.data as { entryPath?: string }).entryPath ?? "index.tsx";
			setEntry(initialEntryPath);
			setLastSavedEntry(initialEntryPath);

			const initialExportName =
				(latestQuery.data as { exportName?: string }).exportName ?? "default";
			setExportName(initialExportName);
			setLastSavedExport(initialExportName);
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
				{
					emailId,
					files: currentFiles,
					entryPath: entry,
					exportName,
					html: compiledHtmlRef.current || undefined,
				},
				{
					onSuccess: () => {
						toast.success("Version saved");
						setLastSavedFiles(currentFiles);
						setLastSavedEntry(entry);
						setLastSavedExport(exportName);
						setSaveCounter((c) => c + 1);
					},
				},
			);
		}
	}

	function handleViewVersion(
		v: {
			id: string;
			html?: string | null;
			files?: unknown;
			entryPath?: string | null;
			exportName?: string | null;
		},
		idx: number,
	) {
		// Save current live state only when entering read-only the first time
		setReadOnlyVersion({
			id: v.id,
			index: idx,
			html: v.html,
			files: v.files as Record<string, string> | null,
		});
		if (
			v.files &&
			typeof v.files === "object" &&
			Object.keys(v.files as Record<string, string>).length
		) {
			const fileMap = v.files as Record<string, string>;
			setFiles(fileMap);
			filesRef.current = fileMap;
			setEntry(v.entryPath ?? "index.tsx");
			setExportName(v.exportName ?? "default");
		} else {
			const h = v.html ?? "";
			setHtml(h);
			htmlRef.current = h;
		}
	}

	function exitReadOnly(options?: { preserveContent?: boolean }) {
		const { preserveContent = false } = options ?? {};

		if (!preserveContent && latestQuery.data) {
			if (latestQuery.data.files) {
				setFiles(latestQuery.data.files as Record<string, string>);
				filesRef.current = latestQuery.data.files as Record<string, string>;
				setEntry(
					(latestQuery.data as { entryPath?: string }).entryPath ?? "index.tsx",
				);
				setExportName(
					(latestQuery.data as { exportName?: string }).exportName ?? "default",
				);
			} else {
				const h = latestQuery.data.html ?? "";
				setHtml(h);
				htmlRef.current = h;
			}
		}

		setReadOnlyVersion(null);
	}

	// Determine dirty state
	const isDirty = isReadOnly
		? false
		: language === "html"
			? html !== lastSavedHtml
			: JSON.stringify(files ?? {}) !== JSON.stringify(lastSavedFiles ?? {}) ||
				entry !== lastSavedEntry ||
				exportName !== lastSavedExport;

	// Track active tab ("editor" or "preview") to control Toolbar visibility
	const [view, setView] = useState<"editor" | "preview">("editor");

	// Show skeleton placeholder while queries are loading to avoid flashing incomplete header content
	if (isPending || emailsQuery?.isPending || latestQuery.isPending) {
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
		<div className="flex h-[calc(100vh_-_4rem)] zen:h-svh w-full flex-col">
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
						manageEmail.mutate({ id: emailId, name: newTitle.trim() });
					}
				}}
				onDelete={() =>
					confirmDeletion(
						{ id: emailId, name: emailName, type: "email" },
						deleteEmail.mutate,
					)
				}
			>
				<VersionHistoryDialog
					emailId={emailId}
					versionCount={versionCount}
					readOnlyVersion={readOnlyVersion}
					onSelectVersion={handleViewVersion}
					exitReadOnly={exitReadOnly}
				/>
			</PageHeader>
			{isReadOnly && (
				<div className="flex items-center justify-between bg-amber-100 px-4 py-1 text-amber-700! text-sm md:py-2 dark:bg-amber-950/80 dark:text-amber-600!">
					<span className="font-medium tabular-nums">
						Version{" "}
						<span className="font-mono">
							{versionCount - (readOnlyVersion?.index ?? 0)}
						</span>
					</span>
					<div className="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => exitReadOnly()}
							title="Exit read-only"
							className="flex items-center gap-1 text-[inherit]! hover:bg-amber-500/25 dark:hover:bg-amber-900! dark:hover:text-white!"
						>
							<X className="size-4.5" />
							<span className="max-md:hidden">Exit</span>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={async () => {
								if (!readOnlyVersion) return;

								// Determine whether to copy HTML or multi-file JSX project
								const hasFiles =
									readOnlyVersion.files &&
									Object.keys(readOnlyVersion.files).length > 0;

								const payload = hasFiles
									? {
											emailId,
											files: readOnlyVersion.files as Record<string, string>,
											entryPath: entry,
											exportName,
										}
									: {
											emailId,
											html: readOnlyVersion.html ?? "",
										};

								try {
									// Save and get the new version ID returned from the server
									const _newVersionId = await versionsSave.mutateAsync(payload);

									// Optimistically bump version count in emails list cache
									const emailsListKey = trpc.emails.list.queryKey({
										projectId,
									});
									queryClient.setQueryData(emailsListKey, (old) => {
										if (!Array.isArray(old)) return old;
										const updatedList = old.map((item) => {
											const record = item as Record<string, unknown>;
											if (record.id === emailId) {
												const currentCount =
													(record.count as number | undefined) ?? 0;
												return { ...record, count: currentCount + 1 };
											}
											return record;
										});
										return updatedList as typeof old;
									});

									// Exit read-only immediately to prevent label flash
									exitReadOnly({ preserveContent: true });

									// Now refresh queries in background
									await Promise.all([
										queryClient.invalidateQueries({
											queryKey: trpc.versions.getLatest.queryKey({ emailId }),
										}),
										queryClient.invalidateQueries({
											queryKey: trpc.versions.list.queryKey({ emailId }),
										}),
										queryClient.invalidateQueries({
											queryKey: trpc.emails.list.queryKey({ projectId }),
										}),
									]);

									// Ensure counts updated
									await queryClient.refetchQueries({
										queryKey: trpc.emails.list.queryKey({ projectId }),
										exact: true,
									});

									await queryClient.refetchQueries({
										queryKey: trpc.versions.getLatest.queryKey({ emailId }),
										exact: true,
									});

									toast.success("Branched into new version");
								} catch (err: unknown) {
									const message =
										err instanceof Error ? err.message : String(err);
									toast.error(`Failed to branch: ${message}`);
								}
							}}
							title="Restore from this version"
							className="flex items-center gap-1 text-[inherit]! hover:bg-amber-500/25 dark:hover:bg-amber-900! dark:hover:text-white!"
						>
							<CircleFadingArrowUp className="size-4.5" />
							<span className="max-md:hidden">Restore</span>
						</Button>
					</div>
				</div>
			)}
			{mounted &&
				(isDesktop ? (
					/* ------------------------ Desktop split view ------------------------ */
					<div className="overflow-visible! flex min-h-0 max-w-svw flex-1 border-t">
						<ResizablePanelGroup
							direction="horizontal"
							className="overflow-visible! flex flex-1"
						>
							<ResizablePanel
								defaultSize={50}
								minSize={25}
								className="overflow-visible!"
							>
								{/* Render editor only when ready to avoid flash */}
								{(() => {
									if (!isReady) return null;
									return (
										<EditorPane
											key={currentVersionId || "live"}
											value={html}
											onChange={(v) => {
												if (isReadOnly) return; // Avoid loops in read-only mode
												setHtml(v ?? "");
												htmlRef.current = v ?? "";
											}}
											{...(language === "jsx"
												? {
														onFilesChange: (
															m: Record<string, string>,
															_e: string,
														) => {
															setFiles(m);
															filesRef.current = m;
														},
													}
												: {})}
											showSidebar={language === "jsx"}
											readOnly={isReadOnly}
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
								<div className="@container/preview flex h-full flex-col">
									<Toolbar
										language={language}
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
										readOnly={isReadOnly}
										entryPath={entry}
										setEntryPath={setEntry}
										exportName={exportName}
										setExportName={setExportName}
										files={files}
										view="preview"
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
										onLogsChange={(
											logs: Array<{ data: string[]; method: ConsoleMethod }>,
										) => setConsoleLogs(logs)}
										exportName={exportName}
										emailId={emailId}
										versionId={currentVersionId}
										onCompiledHtml={handleCompiledHtml}
									/>
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				) : (
					/* -------------------------- Mobile tabs ----------------------------- */
					<div className="@container/preview overflow-visible! flex min-h-0 flex-1 flex-col border-t">
						<Tabs
							value={view}
							onValueChange={(v) => setView(v as "editor" | "preview")}
							className="overflow-visible! relative flex h-full flex-col"
						>
							<TabsContent
								value="editor"
								className="overflow-visible! flex min-h-0 flex-1 flex-col"
							>
								{isReady && (
									<EditorPane
										key={currentVersionId || "live"}
										value={html}
										onChange={(v) => {
											if (isReadOnly) return; // Avoid loops in read-only mode
											setHtml(v ?? "");
											htmlRef.current = v ?? "";
										}}
										{...(language === "jsx"
											? {
													onFilesChange: (
														m: Record<string, string>,
														_e: string,
													) => {
														setFiles(m);
														filesRef.current = m;
													},
												}
											: {})}
										showSidebar={language === "jsx"}
										readOnly={isReadOnly}
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
									onLogsChange={(
										logs: Array<{ data: string[]; method: ConsoleMethod }>,
									) => setConsoleLogs(logs)}
									exportName={exportName}
									emailId={emailId}
									versionId={currentVersionId}
									onCompiledHtml={handleCompiledHtml}
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
							readOnly={isReadOnly}
							entryPath={entry}
							setEntryPath={setEntry}
							exportName={exportName}
							setExportName={setExportName}
							files={files}
							view={view}
						/>
					</div>
				))}
		</div>
	);
}
