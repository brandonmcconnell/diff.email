"use client";

// Rebuilt FileExplorer using the installed TreeView extension
import {
	type FileNode,
	type TreeDataItem,
	TreeView,
	buildFileTree,
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
import { FilePlus2, FolderPlus, MoreVertical } from "lucide-react";
import { useCallback, useMemo } from "react";

interface Props {
	files: FileNode[]; // root level nodes (can be directories or files)
	activeId: string;
	setActiveId: (id: string) => void;
	setFiles: (files: FileNode[]) => void;
}

export function FileExplorer({
	files,
	activeId,
	setActiveId,
	setFiles,
}: Props) {
	console.log("files", files);
	const tree = useMemo(() => buildFileTree(files), [files]);
	console.log("tree", tree);
	// Helpers --------------------------------------------------------
	const newFileNode = (fullPath: string): FileNode => ({
		id: fullPath,
		name: fullPath.split("/").pop() ?? "",
		draggable: true,
		droppable: false,
		content: "",
	});

	const newFolderNode = (fullPath: string): FileNode => ({
		id: fullPath,
		name: fullPath.split("/").pop() ?? "",
		draggable: true,
		droppable: true,
		children: [],
	});

	function handleAddFile(parentId?: string) {
		const name = window.prompt("File name", "");
		if (!name?.trim()) return;
		const trimmed = name.trim();
		const fullPath = parentId ? `${parentId}/${trimmed}` : trimmed;

		if (files.some((f) => f.id === fullPath)) {
			window.alert("A file with that name already exists in this directory.");
			return;
		}

		const node = newFileNode(fullPath);
		setFiles([...files, node]);
		setActiveId(fullPath);
	}

	function handleAddFolder(parentId?: string) {
		const name = window.prompt("Directory name", "");
		if (!name?.trim()) return;
		const trimmed = name.trim();
		const fullPath = parentId ? `${parentId}/${trimmed}` : trimmed;

		if (files.some((f) => f.id === fullPath)) {
			window.alert("A folder with that name already exists in this directory.");
			return;
		}

		const node = newFolderNode(fullPath);
		setFiles([...files, node]);
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
			if (files.some((f) => f.id === destination)) {
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
		[files, setFiles, setActiveId],
	);

	// Selection change ----------------------------------------------
	const handleSelectChange = (item: TreeDataItem | undefined) => {
		if (item) setActiveId(item.id);
	};

	// Render ---------------------------------------------------------
	return (
		<div className="@container flex h-full flex-col gap-2">
			{/* Top toolbar */}
			<div className="flex gap-1">
				<button
					type="button"
					className="flex flex-1 items-center gap-1 rounded border px-1 py-1 text-xs hover:bg-muted"
					onClick={() => handleAddFile()}
				>
					<FilePlus2 className="size-5" />
					File
				</button>
				<button
					type="button"
					className="flex flex-1 items-center gap-1 rounded border px-1 py-1 text-xs hover:bg-muted"
					onClick={() => handleAddFolder()}
				>
					<FolderPlus className="size-5" />
					Directory
				</button>
			</div>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="flex-1 overflow-y-auto">
						<TreeView
							data={decorateWithActions(tree)}
							initialSelectedItemId={activeId}
							onSelectChange={handleSelectChange}
							expandAll
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
	function addChild(
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
					children: addChild(node.children as FileNode[], parentId, child),
				};
			}
			return node;
		});
	}

	function renameNode(id: string) {
		const node = files.find((f) => f.id === id);
		if (!node) return;
		const newName = window.prompt("Rename", node.name);
		if (!newName?.trim()) return;

		const trimmed = newName.trim();
		if (trimmed === node.name) return; // no change

		const parts = id.split("/");
		parts[parts.length - 1] = trimmed;
		const newId = parts.join("/");

		// collision check
		if (files.some((f) => f.id === newId)) {
			window.alert("An item with that name already exists in this directory.");
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
	}

	function deleteNode(id: string) {
		if (!window.confirm("Delete?")) return;
		const remaining = files.filter(
			(f) => !(f.id === id || f.id.startsWith(`${id}/`)),
		);
		setFiles(remaining);
		if (activeId === id || activeId.startsWith(`${id}/`))
			setActiveId("index.html");
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

	function findNode(nodes: FileNode[], id: string): FileNode | null {
		for (const node of nodes) {
			if (node.id === id) return node;
			if (node.children) {
				const found = findNode(node.children as FileNode[], id);
				if (found) return found;
			}
		}
		return null;
	}

	function updateNode(
		nodes: FileNode[],
		id: string,
		partial: Partial<FileNode>,
	): FileNode[] {
		return nodes.map((n) => {
			if (n.id === id) return { ...n, ...partial };
			if (n.children) {
				return {
					...n,
					children: updateNode(n.children as FileNode[], id, partial),
				};
			}
			return n;
		});
	}
}
