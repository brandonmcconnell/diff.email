import { GripVerticalIcon } from "lucide-react";
import type * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";
import { useState } from "react";

function ResizablePanelGroup({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
	return (
		<ResizablePrimitive.PanelGroup
			data-slot="resizable-panel-group"
			className={cn(
				"flex h-full w-full max-w-full overflow-x-hidden data-[panel-group-direction=vertical]:flex-col",
				className,
			)}
			{...props}
		/>
	);
}

function ResizablePanel({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
	return (
		<ResizablePrimitive.Panel
			data-slot="resizable-panel"
			className={cn("min-w-0 max-w-full", className)}
			{...props}
		/>
	);
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean;
}) {
	const [isDragging, setIsDragging] = useState(false);

	return (
		<ResizablePrimitive.PanelResizeHandle
			data-slot="resizable-handle"
			className={cn(
				"after:-translate-x-1/2 data-[panel-group-direction=vertical]:after:-translate-y-1/2 relative flex",
				"w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1",
				"focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
				"data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
				"data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1",
				"data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0",
				"[&[data-panel-group-direction=vertical]>div]:rotate-90",
				isDragging && "bg-neutral-300! dark:bg-neutral-700!",
				className,
			)}
			onDragging={(isDragging) => setIsDragging(isDragging)}
			{...props}
		>
			{withHandle && (
				<div
					className={cn(
						"z-10 flex h-8 w-3 items-center justify-center rounded-full border",
						"border-border bg-neutral-100 hover:border-neutral-300! hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:border-neutral-800! hover:dark:bg-neutral-700",
						isDragging &&
							"border-neutral-300! bg-neutral-300! dark:border-neutral-600! dark:bg-neutral-600!",
					)}
				>
					<GripVerticalIcon className="size-2.5 opacity-75" />
				</div>
			)}
		</ResizablePrimitive.PanelResizeHandle>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
