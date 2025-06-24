import { Atom, CodeXml } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// New stable placeholder list (module scope)
const PLACEHOLDERS = [
	"Go ahead, make my day",
	"May the Force be with you",
	"Here's looking at you, kid",
	"You talking to me?",
	"Show me the money!",
	"Hasta la vista, baby",
	"I'm the king of the world!",
	"Why so serious?",
	"Bond. James Bond.",
	"To infinity and beyond!",
	"I see dead people",
	"E.T. phone home",
	"You're gonna need a bigger boat",
	"Nobody puts Baby in a corner",
	"Houston, we have a problem",
	"I am your father",
	"Say hello to my little friend!",
	"Just keep swimming",
	"There's no place like home",
	"Life is like a box of chocolates",
] as const;

interface Props {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onCreate: (
		title: string,
		language: "html" | "jsx",
		description?: string,
	) => void;
}

export function NewEmailDialog({ open, onOpenChange, onCreate }: Props) {
	const newEmailTitleId = useId();
	const newEmailDescriptionId = useId();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [lang, setLang] = useState<"html" | "jsx">("html");

	// Shuffle-bag to cycle through all quotes before repeating
	const bagRef = useRef<string[]>([]);

	const [placeholder, setPlaceholder] = useState<string>("");

	// When dialog opens, pick next placeholder ensuring even distribution
	useEffect(() => {
		if (open) {
			setTitle("");

			// Refill and shuffle bag when empty
			if (bagRef.current.length === 0) {
				bagRef.current = [...PLACEHOLDERS].sort(() => Math.random() - 0.5);
			}

			const next = bagRef.current.pop() as string;
			setPlaceholder(next);
		}
	}, [open]);

	function handleCreate() {
		if (!title.trim()) return;
		onCreate(title.trim(), lang, description.trim());
		setTitle("");
		setDescription("");
		onOpenChange(false);
	}

	const langOptions = [
		{
			lang: "html",
			label: "HTML",
			description: "Write raw HTML markup.",
			icon: CodeXml,
			activeStyles: "bg-html-100 border-html-600 dark:bg-html-900/20",
		},
		{
			lang: "jsx",
			label: "JSX",
			description: "Use React Email JSX syntax.",
			icon: Atom,
			activeStyles: "bg-jsx-100 border-jsx-600 dark:bg-jsx-900/20",
		},
	] as const;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>New Email</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor={newEmailTitleId} className="font-medium text-sm">
							Title
						</Label>
						<Input
							id={newEmailTitleId}
							placeholder={placeholder}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor={newEmailDescriptionId}
							className="font-medium text-sm"
						>
							Description
						</Label>
						<Textarea
							id={newEmailDescriptionId}
							placeholder="Optional description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[100px]"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<p className="font-medium text-sm">Language</p>
						<RadioGroup
							value={lang}
							onValueChange={(v) => v && setLang(v as "html" | "jsx")}
							className="grid gap-2"
						>
							{langOptions.map((option) => (
								<label
									htmlFor={`lang-choice-${option.lang}`}
									className={cn(
										"flex items-center gap-4 rounded-md border p-3",
										lang === option.lang
											? option.activeStyles
											: "hover:bg-accent",
									)}
									key={option.lang}
								>
									<RadioGroupItem
										value={option.lang}
										id={`lang-choice-${option.lang}`}
									/>
									<div className="space-y-1">
										<div className="flex items-center gap-1">
											<option.icon className="size-4" />
											{option.label}
										</div>
										<p className="text-muted-foreground text-xs">
											{option.description}
										</p>
									</div>
								</label>
							))}
						</RadioGroup>
					</div>
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
