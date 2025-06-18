import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";

interface Props {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onCreate: (title: string, language: "html" | "jsx") => void;
}

export function NewEmailDialog({ open, onOpenChange, onCreate }: Props) {
	const [title, setTitle] = useState("");
	const [lang, setLang] = useState<"html" | "jsx">("html");

	function handleCreate() {
		if (!title.trim()) return;
		onCreate(title.trim(), lang);
		setTitle("");
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>New Email</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					<Input
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<ToggleGroup
						type="single"
						value={lang}
						onValueChange={(v) => v && setLang(v as "html" | "jsx")}
						variant="outline"
					>
						<ToggleGroupItem value="html">HTML</ToggleGroupItem>
						<ToggleGroupItem value="jsx">JSX</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<DialogFooter>
					<Button onClick={handleCreate} disabled={!title.trim()}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
