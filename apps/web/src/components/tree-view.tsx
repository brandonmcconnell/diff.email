import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cva } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import React from "react";

const treeVariants = cva(
	"group before:-z-10 relative before:absolute before:left-0 before:h-[2rem] before:w-full before:rounded-lg before:bg-accent/70 before:opacity-0 hover:before:opacity-100",
);

const selectedTreeVariants = cva(
	"text-accent-foreground before:bg-accent/70 before:opacity-100",
);

const dragOverVariants = cva(
	"text-primary-foreground before:bg-primary/20 before:opacity-100",
);

interface TreeDataItem {
	id: string;
	name: string;
	icon?: React.ComponentType<{ className?: string }>;
	selectedIcon?: React.ComponentType<{ className?: string }>;
	openIcon?: React.ComponentType<{ className?: string }>;
	children?: TreeDataItem[];
	actions?: React.ReactNode;
	onClick?: () => void;
	draggable?: boolean;
	droppable?: boolean;
	disabled?: boolean;
	contextMenu?: React.ReactNode;
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
	data: TreeDataItem[] | TreeDataItem;
	initialSelectedItemId?: string;
	onSelectChange?: (item: TreeDataItem | undefined) => void;
	expandAll?: boolean;
	defaultNodeIcon?: React.ComponentType<{ className?: string }>;
	defaultLeafIcon?: React.ComponentType<{ className?: string }>;
	onDocumentDrag?: (sourceItem: TreeDataItem, targetItem: TreeDataItem) => void;
};

const TreeView = React.forwardRef<HTMLDivElement, TreeProps>(
	(
		{
			data,
			initialSelectedItemId,
			onSelectChange,
			expandAll,
			defaultLeafIcon,
			defaultNodeIcon,
			className,
			onDocumentDrag,
			...props
		},
		ref,
	) => {
		const [selectedItemId, setSelectedItemId] = React.useState<
			string | undefined
		>(initialSelectedItemId);

		const [draggedItem, setDraggedItem] = React.useState<TreeDataItem | null>(
			null,
		);

		const handleSelectChange = React.useCallback(
			(item: TreeDataItem | undefined) => {
				setSelectedItemId(item?.id);
				if (onSelectChange) {
					onSelectChange(item);
				}
			},
			[onSelectChange],
		);

		const handleDragStart = React.useCallback((item: TreeDataItem) => {
			setDraggedItem(item);
		}, []);

		const handleDrop = React.useCallback(
			(targetItem: TreeDataItem) => {
				if (draggedItem && onDocumentDrag && draggedItem.id !== targetItem.id) {
					onDocumentDrag(draggedItem, targetItem);
				}
				setDraggedItem(null);
			},
			[draggedItem, onDocumentDrag],
		);

		const expandedItemIds = React.useMemo(() => {
			if (!initialSelectedItemId) {
				return [] as string[];
			}

			const ids: string[] = [];

			function walkTreeItems(
				items: TreeDataItem[] | TreeDataItem,
				targetId: string,
			) {
				if (Array.isArray(items)) {
					for (let i = 0; i < items.length; i++) {
						if (!items[i]) continue;
						ids.push(items[i].id);
						if (walkTreeItems(items[i], targetId) && !expandAll) {
							return true;
						}
						if (!expandAll) ids.pop();
					}
				} else if (!expandAll && items.id === targetId) {
					return true;
				} else if (items.children) {
					return walkTreeItems(items.children, targetId);
				}
			}

			walkTreeItems(data, initialSelectedItemId);
			return ids;
		}, [data, expandAll, initialSelectedItemId]);

		return (
			<div className={cn("relative overflow-hidden p-2", className)}>
				<TreeItem
					data={data}
					ref={ref}
					selectedItemId={selectedItemId}
					handleSelectChange={handleSelectChange}
					expandedItemIds={expandedItemIds}
					defaultLeafIcon={defaultLeafIcon}
					defaultNodeIcon={defaultNodeIcon}
					handleDragStart={handleDragStart}
					handleDrop={handleDrop}
					draggedItem={draggedItem}
					{...props}
				/>
				<div
					className="h-[48px] w-full"
					onDrop={(e) => {
						handleDrop({ id: "", name: "parent_div" });
					}}
				/>
			</div>
		);
	},
);
TreeView.displayName = "TreeView";

type TreeItemProps = TreeProps & {
	selectedItemId?: string;
	handleSelectChange: (item: TreeDataItem | undefined) => void;
	expandedItemIds: string[];
	defaultNodeIcon?: React.ComponentType<{ className?: string }>;
	defaultLeafIcon?: React.ComponentType<{ className?: string }>;
	handleDragStart?: (item: TreeDataItem) => void;
	handleDrop?: (item: TreeDataItem) => void;
	draggedItem: TreeDataItem | null;
};

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
	(
		{
			className,
			data,
			selectedItemId,
			handleSelectChange,
			expandedItemIds,
			defaultNodeIcon,
			defaultLeafIcon,
			handleDragStart,
			handleDrop,
			draggedItem,
			...props
		},
		ref,
	) => {
		if (!Array.isArray(data)) {
			data = [data];
		}
		return (
			<div ref={ref} role="tree" className={className} {...props}>
				<ul className="ml-0 list-none pl-0">
					{data.map((item) => (
						<li key={item.id}>
							{item.children ? (
								<TreeNode
									item={item}
									selectedItemId={selectedItemId}
									expandedItemIds={expandedItemIds}
									handleSelectChange={handleSelectChange}
									defaultNodeIcon={defaultNodeIcon}
									defaultLeafIcon={defaultLeafIcon}
									handleDragStart={handleDragStart}
									handleDrop={handleDrop}
									draggedItem={draggedItem}
								/>
							) : (
								<TreeLeaf
									item={item}
									selectedItemId={selectedItemId}
									handleSelectChange={handleSelectChange}
									defaultLeafIcon={defaultLeafIcon}
									handleDragStart={handleDragStart}
									handleDrop={handleDrop}
									draggedItem={draggedItem}
								/>
							)}
						</li>
					))}
				</ul>
			</div>
		);
	},
);
TreeItem.displayName = "TreeItem";

const TreeNode = ({
	item,
	handleSelectChange,
	expandedItemIds,
	selectedItemId,
	defaultNodeIcon,
	defaultLeafIcon,
	handleDragStart,
	handleDrop,
	draggedItem,
}: {
	item: TreeDataItem;
	handleSelectChange: (item: TreeDataItem | undefined) => void;
	expandedItemIds: string[];
	selectedItemId?: string;
	defaultNodeIcon?: React.ComponentType<{ className?: string }>;
	defaultLeafIcon?: React.ComponentType<{ className?: string }>;
	handleDragStart?: (item: TreeDataItem) => void;
	handleDrop?: (item: TreeDataItem) => void;
	draggedItem: TreeDataItem | null;
}) => {
	const [value, setValue] = React.useState(
		expandedItemIds.includes(item.id) ? [item.id] : [],
	);
	const [isDragOver, setIsDragOver] = React.useState(false);

	const onDragStart = (e: React.DragEvent) => {
		if (!item.draggable) {
			e.preventDefault();
			return;
		}
		e.dataTransfer.setData("text/plain", item.id);
		handleDragStart?.(item);
	};

	const onDragOver = (e: React.DragEvent) => {
		if (item.droppable !== false && draggedItem && draggedItem.id !== item.id) {
			e.preventDefault();
			setIsDragOver(true);
		}
	};

	const onDragLeave = () => {
		setIsDragOver(false);
	};

	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		handleDrop?.(item);
	};

	const rowContent = (
		<AccordionPrimitive.Root
			type="multiple"
			value={value}
			onValueChange={(s) => setValue(s)}
		>
			<AccordionPrimitive.Item value={item.id}>
				<AccordionTrigger
					className={cn(
						treeVariants(),
						selectedItemId === item.id && selectedTreeVariants(),
						isDragOver && dragOverVariants(),
					)}
					onClick={() => {
						handleSelectChange(item);
						item.onClick?.();
					}}
					draggable={!!item.draggable}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
				>
					<TreeIcon
						item={item}
						isSelected={selectedItemId === item.id}
						isOpen={value.includes(item.id)}
						default={defaultNodeIcon}
					/>
					<span className="ml-1 justify-start truncate text-sm">
						{item.name}
					</span>
					<TreeActions isSelected={selectedItemId === item.id}>
						{item.actions}
					</TreeActions>
				</AccordionTrigger>
				<AccordionContent className="ml-4 border-l pl-1">
					<TreeItem
						data={item.children ? item.children : item}
						selectedItemId={selectedItemId}
						handleSelectChange={handleSelectChange}
						expandedItemIds={expandedItemIds}
						defaultLeafIcon={defaultLeafIcon}
						defaultNodeIcon={defaultNodeIcon}
						handleDragStart={handleDragStart}
						handleDrop={handleDrop}
						draggedItem={draggedItem}
					/>
				</AccordionContent>
			</AccordionPrimitive.Item>
		</AccordionPrimitive.Root>
	);

	return item.contextMenu ? (
		<ContextMenu>
			<ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
			{item.contextMenu}
		</ContextMenu>
	) : (
		rowContent
	);
};

const TreeLeaf = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		item: TreeDataItem;
		selectedItemId?: string;
		handleSelectChange: (item: TreeDataItem | undefined) => void;
		defaultLeafIcon?: React.ComponentType<{ className?: string }>;
		handleDragStart?: (item: TreeDataItem) => void;
		handleDrop?: (item: TreeDataItem) => void;
		draggedItem: TreeDataItem | null;
	}
>(
	(
		{
			className,
			item,
			selectedItemId,
			handleSelectChange,
			defaultLeafIcon,
			handleDragStart,
			handleDrop,
			draggedItem,
			...props
		},
		ref,
	) => {
		const [isDragOver, setIsDragOver] = React.useState(false);

		const onDragStart = (e: React.DragEvent) => {
			if (!item.draggable || item.disabled) {
				e.preventDefault();
				return;
			}
			e.dataTransfer.setData("text/plain", item.id);
			handleDragStart?.(item);
		};

		const onDragOver = (e: React.DragEvent) => {
			if (
				item.droppable !== false &&
				!item.disabled &&
				draggedItem &&
				draggedItem.id !== item.id
			) {
				e.preventDefault();
				setIsDragOver(true);
			}
		};

		const onDragLeave = () => {
			setIsDragOver(false);
		};

		const onDrop = (e: React.DragEvent) => {
			if (item.disabled) return;
			e.preventDefault();
			setIsDragOver(false);
			handleDrop?.(item);
		};

		const row = (
			<div
				ref={ref}
				className={cn(
					"ml-5 flex cursor-pointer items-center py-2 text-left before:right-1",
					treeVariants(),
					className,
					selectedItemId === item.id && selectedTreeVariants(),
					isDragOver && dragOverVariants(),
					item.disabled && "pointer-events-none cursor-not-allowed opacity-50",
				)}
				onClick={() => {
					if (item.disabled) return;
					handleSelectChange(item);
					item.onClick?.();
				}}
				draggable={!!item.draggable && !item.disabled}
				onDragStart={onDragStart}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				{...props}
			>
				<TreeIcon
					item={item}
					isSelected={selectedItemId === item.id}
					default={defaultLeafIcon}
				/>
				<span className="flex-grow truncate text-sm">{item.name}</span>
				<TreeActions isSelected={selectedItemId === item.id && !item.disabled}>
					{item.actions}
				</TreeActions>
			</div>
		);

		return item.contextMenu ? (
			<ContextMenu>
				<ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
				{item.contextMenu}
			</ContextMenu>
		) : (
			row
		);
	},
);
TreeLeaf.displayName = "TreeLeaf";

const AccordionTrigger = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimitive.Header>
		<AccordionPrimitive.Trigger
			ref={ref}
			className={cn(
				"flex w-full flex-1 items-center py-2 transition-all first:[&[data-state=open]>svg]:rotate-90",
				className,
			)}
			{...props}
		>
			<ChevronRight className="h-4 w-4 shrink-0 text-accent-foreground/50 transition-transform duration-200" />
			{children}
		</AccordionPrimitive.Trigger>
	</AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimitive.Content
		ref={ref}
		className={cn(
			"overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
			className,
		)}
		{...props}
	>
		<div className="pt-0 pb-1">{children}</div>
	</AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

const TreeIcon = ({
	item,
	isOpen,
	isSelected,
	default: defaultIcon,
}: {
	item: TreeDataItem;
	isOpen?: boolean;
	isSelected?: boolean;
	default?: React.ComponentType<{ className?: string }>;
}) => {
	let Icon = defaultIcon;
	if (isSelected && item.selectedIcon) {
		Icon = item.selectedIcon;
	} else if (isOpen && item.openIcon) {
		Icon = item.openIcon;
	} else if (item.icon) {
		Icon = item.icon;
	}
	return Icon ? <Icon className="mr-2 h-4 w-4 shrink-0" /> : <></>;
};

const TreeActions = ({
	children,
	isSelected,
}: {
	children: React.ReactNode;
	isSelected: boolean;
}) => {
	return (
		<div
			className={cn(
				"absolute right-3 transition-opacity",
				isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
			)}
		>
			{children}
		</div>
	);
};

export { TreeView, type TreeDataItem };
