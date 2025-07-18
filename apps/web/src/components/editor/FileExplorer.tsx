"use client";

import {
	CopyMinus,
	CopyPlus,
	FilePlus2,
	FolderPlus,
	MoreVertical,
	PanelLeftClose,
	Search as SearchIcon,
	SearchX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Rebuilt FileExplorer using the installed TreeView extension
import {
	buildFileTree,
	type FileNode,
	type TreeDataItem,
	TreeView,
} from "@/components/tree-view";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { confirm, prompt } from "@/lib/dialogs";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface Props {
	files: FileNode[]; // root level nodes (can be directories or files)
	activeId: string;
	setActiveId: (id: string) => void;
	setFiles: (files: FileNode[]) => void;
	onCollapse?: () => void;
}

export function FileExplorer({
	files,
	activeId,
	setActiveId,
	setFiles,
	onCollapse,
}: Props) {
	// Expand / collapse controls -----------------------------------
	const [expandAll, setExpandAll] = useState(false);
	const [treeKey, setTreeKey] = useState(0);
	const [anyExpanded, setAnyExpanded] = useState(false);

	// Search / filter ----------------------------------------------
	const [searchActive, setSearchActive] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const treeContainerRef = useRef<HTMLDivElement>(null);

	const refreshAnyExpanded = useCallback(() => {
		if (!treeContainerRef.current) {
			setAnyExpanded(false);
			return;
		}
		// Check ONLY top-level accordion items
		const topLevelOpen = treeContainerRef.current.querySelector(
			'[role="tree"] > ul > li [data-state="open"]',
		);
		setAnyExpanded(!!topLevelOpen);
	}, []);

	useEffect(() => {
		refreshAnyExpanded();
		const target = treeContainerRef.current;
		if (!target) return;
		const observer = new MutationObserver(() => refreshAnyExpanded());
		observer.observe(target, {
			subtree: true,
			attributes: true,
			attributeFilter: ["data-state"],
		});
		return () => observer.disconnect();
	}, [refreshAnyExpanded]);

	const collapseAllVisible = () => {
		setExpandAll(false);
		setTreeKey((k) => k + 1);
		setAnyExpanded(false);
	};

	const expandAllVisible = () => {
		setExpandAll(true);
		setTreeKey((k) => k + 1);
		setAnyExpanded(true);
	};

	const selectedIdForTree = expandAll ? activeId : undefined;

	// Derive list based on search query
	const displayedFiles = useMemo(() => {
		if (!searchActive || !searchQuery.trim()) return files;
		const q = searchQuery.toLowerCase();
		const matches = (n: FileNode): boolean => {
			if (n.name.toLowerCase().includes(q)) return true;
			if (!n.children && n.content && n.content.toLowerCase().includes(q))
				return true;
			return false;
		};
		return files.filter(matches);
	}, [files, searchActive, searchQuery]);

	const tree = useMemo(() => buildFileTree(displayedFiles), [displayedFiles]);

	// Helpers --------------------------------------------------------
	const newFileNode = (fullPath: string): FileNode => ({
		id: fullPath,
		name: fullPath.split("/").pop() ?? "",
		draggable: true,
		droppable: false,
		content: "",
		dirty: true,
	});

	const newFolderNode = (fullPath: string): FileNode => ({
		id: fullPath,
		name: fullPath.split("/").pop() ?? "",
		draggable: true,
		droppable: true,
		children: [],
	});

	// Utility helper to flatten the entire tree (folders + files) into a single list
	const flattenNodes = useCallback((nodes: FileNode[]): FileNode[] => {
		return nodes.flatMap((n) => [
			n,
			...(n.children ? flattenNodes(n.children as FileNode[]) : []),
		]);
	}, []);

	// Returns true if any existing node would collide with the given path.
	// For folders we must also consider children like "foo/bar.txt" colliding with new folder "foo".
	const hasCollision = useCallback(
		(candidatePath: string): boolean =>
			flattenNodes(files).some(
				(n) => n.id === candidatePath || n.id.startsWith(`${candidatePath}/`),
			),
		[files, flattenNodes],
	);

	// Radix ContextMenu uses `duration-200` exit animation; delay slightly longer
	// so the menu is fully removed (and focus released) before we open the prompt.
	const runAfterMenuClose = (cb: () => void) => {
		setTimeout(cb, 250); // 250ms > 200ms animation
	};

	function handleAddFile(parentId?: string) {
		runAfterMenuClose(async () => {
			const name = await prompt({ title: "File name" });
			if (!name?.trim()) return;
			const trimmed = name.trim();
			const fullPath = parentId ? `${parentId}/${trimmed}` : trimmed;

			if (hasCollision(fullPath)) {
				window.alert("A file with that name already exists in this directory.");
				return;
			}

			const node = newFileNode(fullPath);
			setFiles([...files, node]);
			setActiveId(fullPath);
		});
	}

	function handleAddFolder(parentId?: string) {
		runAfterMenuClose(async () => {
			const name = await prompt({ title: "Directory name" });
			if (!name?.trim()) return;
			const trimmed = name.trim();
			const fullPath = parentId ? `${parentId}/${trimmed}` : trimmed;

			if (hasCollision(fullPath)) {
				window.alert(
					"A folder with that name already exists in this directory.",
				);
				return;
			}

			const node = newFolderNode(fullPath);
			setFiles([...files, node]);
		});
	}

	// Drag & drop — rewrite paths in the flat list ------------------
	const handleDocumentDrag = useCallback(
		(source: TreeDataItem, target: TreeDataItem) => {
			console.log("source", source);
			console.log("target", target);
			if (source.id === target.id) return;

			const baseName = source.id.split("/").pop() ?? "";
			const destinationPrefix = target.id; // "" ⇢ root
			const destination = destinationPrefix
				? `${destinationPrefix}/${baseName}`
				: baseName;

			// If moving to same directory (no path change), ignore
			const sourceParent = source.id.split("/").slice(0, -1).join("/");
			if (sourceParent === destinationPrefix) return; // noop

			// duplicate safeguard
			if (hasCollision(destination)) {
				window.alert(
					"An item with that name already exists in the target directory.",
				);
				return;
			}

			function flatten(nodes: FileNode[]): FileNode[] {
				return nodes.flatMap((n) => [
					n,
					...(n.children ? flatten(n.children as FileNode[]) : []),
				]);
			}

			const flat = flatten(files);
			const updated = flat.map((n) =>
				n.id === source.id || n.id.startsWith(`${source.id}/`)
					? { ...n, id: destination + n.id.slice(source.id.length) }
					: n,
			);

			// preserve folder status
			const cleaned = updated.map((n) =>
				n.droppable ? { ...n, children: [] } : { ...n, children: undefined },
			);

			setFiles(cleaned);
			setActiveId(destination);
		},
		[files, setFiles, setActiveId, hasCollision],
	);

	// Selection change ----------------------------------------------
	const handleSelectChange = (item: TreeDataItem | undefined) => {
		if (item) setActiveId(item.id);
	};

	// Render ---------------------------------------------------------
	return (
		<div className="@container flex h-full flex-col">
			{/* Toolbar (top on md+, bottom on mobile) */}
			<div className="flex justify-between max-md:order-2 max-md:mt-auto max-md:mb-2">
				<div className="flex justify-end gap-0.5">
					{/* Collapse FileTree sidebar */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={onCollapse}
								className="size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100"
							>
								<PanelLeftClose className="size-4.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Filter files</p>
						</TooltipContent>
					</Tooltip>

					{/* Search Button */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setSearchActive((prev) => {
										const next = !prev;
										if (!next) setSearchQuery("");
										return next;
									});
								}}
								className={cn(
									"size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100",
									searchActive && "opacity-100",
								)}
							>
								{searchActive ? (
									<SearchX className="size-4.5" />
								) : (
									<SearchIcon className="size-4.5" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Filter files</p>
						</TooltipContent>
					</Tooltip>
				</div>
				<div className="flex justify-end gap-0.5">
					{/* New File Button with Tooltip */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								onClick={() => handleAddFile()}
								size="icon"
								className="size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100"
							>
								<FilePlus2 className="size-4.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>New file</p>
						</TooltipContent>
					</Tooltip>

					{/* New Directory Button with Tooltip */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								onClick={() => handleAddFolder()}
								size="icon"
								className="size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100"
							>
								<FolderPlus className="size-4.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>New directory</p>
						</TooltipContent>
					</Tooltip>

					{anyExpanded ? (
						/* Collapse All Button */
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									onClick={collapseAllVisible}
									size="icon"
									className="size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100"
								>
									<CopyMinus className="size-4.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Collapse all</p>
							</TooltipContent>
						</Tooltip>
					) : (
						/* Expand All Button */
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									onClick={expandAllVisible}
									size="icon"
									className="size-7 text-foreground opacity-50 transition-opacity ease-out hover:opacity-100"
								>
									<CopyPlus className="size-4.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Expand all</p>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>

			{/* Search input */}
			{searchActive && (
				<div className="px-1 py-1">
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Filter files..."
						className="h-8 w-full bg-background dark:bg-white/10"
					/>
				</div>
			)}

			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div ref={treeContainerRef} className="flex-1 overflow-y-auto">
						<TreeView
							key={treeKey}
							data={decorateWithActions(tree)}
							initialSelectedItemId={selectedIdForTree}
							onSelectChange={handleSelectChange}
							expandAll={expandAll}
							defaultNodeIcon={undefined}
							defaultLeafIcon={undefined}
							onDocumentDrag={handleDocumentDrag}
						/>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onSelect={() => handleAddFile()}>
						New file
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => handleAddFolder()}>
						New directory
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);

	// ---------------- utility helpers ------------------------------
	function _addChild(
		tree: FileNode[],
		parentId: string,
		child: FileNode,
	): FileNode[] {
		return tree.map((node) => {
			if (node.id === parentId) {
				const children = node.children ? [...node.children, child] : [child];
				return { ...node, children };
			}
			if (node.children) {
				return {
					...node,
					children: _addChild(node.children as FileNode[], parentId, child),
				};
			}
			return node;
		});
	}

	function renameNode(id: string) {
		runAfterMenuClose(async () => {
			const node = files.find((f) => f.id === id);
			if (!node) return;
			const newName = await prompt({
				title: "Rename",
				defaultValue: node.name,
			});
			if (!newName?.trim()) return;

			const trimmed = newName.trim();
			if (trimmed === node.name) return; // no change

			const parts = id.split("/");
			parts[parts.length - 1] = trimmed;
			const newId = parts.join("/");

			// collision check
			if (hasCollision(newId)) {
				window.alert(
					"An item with that name already exists in this directory.",
				);
				return;
			}

			const updated = files.map((n) =>
				n.id === id || n.id.startsWith(`${id}/`)
					? {
							...n,
							id: newId + n.id.slice(id.length),
							name: n.id === id ? trimmed : n.name,
						}
					: n,
			);
			setFiles(updated);
			setActiveId(newId);
		});
	}

	async function deleteNode(id: string) {
		const proceed = await confirm({ title: "Delete?", variant: "destructive" });
		if (!proceed) return;
		const remaining = files.filter(
			(f) => !(f.id === id || f.id.startsWith(`${id}/`)),
		);
		setFiles(remaining);
		if (activeId === id || activeId.startsWith(`${id}/`)) {
			setActiveId("index.html");
		}
	}

	function decorateWithActions(nodes: FileNode[]): FileNode[] {
		return nodes.map((n) => {
			const decorated: FileNode = {
				...n,
				actions: (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<MoreVertical className="size-3 cursor-pointer" />
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onSelect={() => renameNode(n.id)}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive"
								onSelect={() => deleteNode(n.id)}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
				contextMenu: (
					<ContextMenuContent>
						{n.children && (
							<>
								<ContextMenuItem onSelect={() => handleAddFile(n.id)}>
									New file
								</ContextMenuItem>
								<ContextMenuItem onSelect={() => handleAddFolder(n.id)}>
									New directory
								</ContextMenuItem>
								<ContextMenuSeparator />
							</>
						)}
						<ContextMenuItem onSelect={() => renameNode(n.id)}>
							Rename
						</ContextMenuItem>
						<ContextMenuItem
							onSelect={() => deleteNode(n.id)}
							variant="destructive"
						>
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				),
			};
			if (n.children) {
				decorated.children = decorateWithActions(n.children as FileNode[]);
			}
			return decorated;
		});
	}

	function _findNode(nodes: FileNode[], id: string): FileNode | null {
		for (const node of nodes) {
			if (node.id === id) return node;
			if (node.children) {
				const found = _findNode(node.children as FileNode[], id);
				if (found) return found;
			}
		}
		return null;
	}

	function _updateNode(
		nodes: FileNode[],
		id: string,
		partial: Partial<FileNode>,
	): FileNode[] {
		return nodes.map((n) => {
			if (n.id === id) return { ...n, ...partial };
			if (n.children) {
				return {
					...n,
					children: _updateNode(n.children as FileNode[], id, partial),
				};
			}
			return n;
		});
	}
}
