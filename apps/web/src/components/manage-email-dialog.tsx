import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
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

interface ManageEmailDialogProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	initialName: string;
	initialDescription?: string | null;
	onSave: (opts: { name: string; description: string }) => void;
}

export function ManageEmailDialog({
	open,
	onOpenChange,
	initialName,
	initialDescription,
	onSave,
}: ManageEmailDialogProps) {
	const manageEmailNameId = useId();
	const manageEmailDescriptionId = useId();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (open) {
			setName(initialName);
			setDescription(initialDescription ?? "");
		}
	}, [open, initialName, initialDescription]);

	function handleSave() {
		if (!name.trim()) return;
		onSave({ name: name.trim(), description: description.trim() });
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>Manage Email</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor={manageEmailNameId} className="font-medium text-sm">
							Name
						</Label>
						<Input
							id={manageEmailNameId}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor={manageEmailDescriptionId}
							className="font-medium text-sm"
						>
							Description
						</Label>
						<Textarea
							id={manageEmailDescriptionId}
							value={description}
							placeholder="Optional description"
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[100px]"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} disabled={!name.trim()}>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
