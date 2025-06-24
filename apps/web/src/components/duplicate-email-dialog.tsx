import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DuplicateEmailDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	originalName: string;
	onDuplicate: (opts: {
		name: string;
		description: string;
		copyAll: boolean;
	}) => void;
}

export function DuplicateEmailDialog({
	open,
	onOpenChange,
	originalName,
	onDuplicate,
}: DuplicateEmailDialogProps) {
	const dupeEmailNameId = useId();
	const dupeEmailDescriptionId = useId();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [copyAll, setCopyAll] = useState(false);

	useEffect(() => {
		if (open) {
			setName(`${originalName} (copy)`);
			setDescription("");
			setCopyAll(false);
		}
	}, [open, originalName]);

	function handleDuplicate() {
		if (!name.trim()) return;
		onDuplicate({
			name: name.trim(),
			description: description.trim(),
			copyAll,
		});
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>Duplicate Email</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor={dupeEmailNameId} className="font-medium text-sm">
							Name
						</Label>
						<Input
							id={dupeEmailNameId}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor={dupeEmailDescriptionId}
							className="font-medium text-sm"
						>
							Description
						</Label>
						<Textarea
							id={dupeEmailDescriptionId}
							value={description}
							placeholder="Optional description"
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[100px]"
						/>
					</div>

					{/* Toggle for copy all versions */}
					<Label
						className={cn(
							"flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950",
						)}
					>
						<Checkbox
							checked={copyAll}
							onCheckedChange={(v) => setCopyAll(!!v)}
							className="mt-0.5 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
						/>
						<div className="grid gap-1.5 font-normal">
							<p className="font-medium text-sm leading-none">
								Copy all versions
							</p>
							<p className="text-muted-foreground text-sm">
								When enabled, every version will be copied into the new email.
								Otherwise, only the latest version is copied.
							</p>
						</div>
					</Label>
				</div>
				<DialogFooter>
					<Button onClick={handleDuplicate} disabled={!name.trim()}>
						Duplicate
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
