"use client";

// Rebuilt FileExplorer using the installed TreeView extension
import { type TreeDataItem, TreeView } from "@/components/tree-view";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus } from "lucide-react";
import { useCallback } from "react";

export interface FileNode extends TreeDataItem {
	content?: string; // only for leaf nodes (files)
}

interface Props {
	files: FileNode[]; // root level nodes (can be folders or files)
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
	// Helpers --------------------------------------------------------
	const newFileNode = (name: string): FileNode => ({
		id: crypto.randomUUID(),
		name,
		draggable: true,
		droppable: false,
		content: "",
	});

	const newFolderNode = (name: string): FileNode => ({
		id: crypto.randomUUID(),
		name,
		draggable: true,
		droppable: true,
		children: [],
	});

	function handleAddFile(parentId?: string) {
		const name = window.prompt("File name", "untitled.html");
		if (!name?.trim()) return;
		const node = newFileNode(name.trim());
		if (!parentId) {
			setFiles([...files, node]);
		} else {
			setFiles(addChild(files, parentId, node));
		}
		setActiveId(node.id);
	}

	function handleAddFolder(parentId?: string) {
		const name = window.prompt("Folder name", "folder");
		if (!name?.trim()) return;
		const node = newFolderNode(name.trim());
		if (!parentId) {
			setFiles([...files, node]);
		} else {
			setFiles(addChild(files, parentId, node));
		}
	}

	// Drag & drop ----------------------------------------------------
	const handleDocumentDrag = useCallback(
		(source: TreeDataItem, target: TreeDataItem) => {
			// prevent dropping on itself
			if (source.id === target.id) return;
			setFiles(moveNode(files, source.id, target.id));
		},
		[files, setFiles],
	);

	// Selection change ----------------------------------------------
	const handleSelectChange = (item: TreeDataItem | undefined) => {
		if (item) setActiveId(item.id);
	};

	// Render ---------------------------------------------------------
	return (
		<div className="flex h-full flex-col gap-2">
			<div className="flex-1 overflow-y-auto">
				<TreeView
					data={decorateWithActions(files)}
					initialSelectedItemId={activeId}
					onSelectChange={handleSelectChange}
					expandAll
					defaultNodeIcon={undefined}
					defaultLeafIcon={undefined}
					onDocumentDrag={handleDocumentDrag}
				/>
			</div>
			{/* Footer actions */}
			<div className="flex gap-1">
				<button
					type="button"
					className="flex flex-1 items-center justify-center gap-1 rounded border px-1 py-1 text-xs hover:bg-muted"
					onClick={() => handleAddFile()}
				>
					<Plus className="size-3" /> File
				</button>
				<button
					type="button"
					className="flex flex-1 items-center justify-center gap-1 rounded border px-1 py-1 text-xs hover:bg-muted"
					onClick={() => handleAddFolder()}
				>
					<Plus className="size-3" /> Folder
				</button>
			</div>
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

	function moveNode(
		tree: FileNode[],
		sourceId: string,
		targetId: string,
	): FileNode[] {
		let sourceNode: FileNode | null = null;

		// Remove source node from tree
		function removeNode(nodes: FileNode[]): FileNode[] {
			return nodes.filter((n) => {
				if (n.id === sourceId) {
					sourceNode = n;
					return false;
				}
				if (n.children) {
					n.children = removeNode(n.children as FileNode[]);
				}
				return true;
			});
		}

		const withoutSource = removeNode([...tree]);

		if (!sourceNode) return tree; // not found

		// Add to new parent (target)
		function insertNode(nodes: FileNode[]): FileNode[] {
			return nodes.map((n) => {
				if (sourceNode && n.id === targetId) {
					if (n.children) {
						n.children.push(sourceNode);
					} else {
						n.children = [sourceNode];
					}
					return n;
				}
				if (n.children) {
					n.children = insertNode(n.children as FileNode[]);
				}
				return n;
			});
		}

		const inserted = targetId
			? insertNode(withoutSource)
			: [...withoutSource, ...(sourceNode ? [sourceNode] : [])];
		return inserted;
	}

	function renameNode(id: string) {
		const node = findNode(files, id);
		if (!node) return;
		const newName = window.prompt("Rename", node.name);
		if (!newName?.trim()) return;
		setFiles(updateNode(files, id, { name: newName.trim() }));
	}

	function deleteNode(id: string) {
		if (!window.confirm("Delete?")) return;
		setFiles(removeNode(files, id));
		if (activeId === id) setActiveId("index.html");
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

	function removeNode(nodes: FileNode[], id: string): FileNode[] {
		return nodes.filter((n) => {
			if (n.id === id) return false;
			if (n.children) {
				n.children = removeNode(n.children as FileNode[], id);
			}
			return true;
		});
	}
}
