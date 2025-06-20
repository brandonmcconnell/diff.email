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
import { cn } from "@/lib/utils";
import { Atom, CodeXml } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onCreate: (title: string, language: "html" | "jsx") => void;
}

export function NewEmailDialog({ open, onOpenChange, onCreate }: Props) {
	const [title, setTitle] = useState("");
	const [lang, setLang] = useState<"html" | "jsx">("html");

	// Fun placeholder suggestions
	const placeholders = [
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

	// Shuffle-bag to cycle through all quotes before repeating
	const bagRef = useRef<string[]>([]);

	const [placeholder, setPlaceholder] = useState<string>("");

	// When dialog opens, pick next placeholder ensuring even distribution
	useEffect(() => {
		if (open) {
			setTitle("");

			// Refill and shuffle bag when empty
			if (bagRef.current.length === 0) {
				bagRef.current = [...placeholders].sort(() => Math.random() - 0.5);
			}

			const next = bagRef.current.pop() as string;
			setPlaceholder(next);
		}
	}, [open, placeholders]);

	function handleCreate() {
		if (!title.trim()) return;
		onCreate(title.trim(), lang);
		setTitle("");
		onOpenChange(false);
	}

	const langOptions = [
		{
			lang: "html",
			label: "HTML",
			description: "Write raw HTML markup.",
			icon: CodeXml,
			activeStyles: "bg-emerald-100 border-emerald-600 dark:bg-emerald-900/20",
		},
		{
			lang: "jsx",
			label: "JSX",
			description: "Use React Email JSX syntax.",
			icon: Atom,
			activeStyles: "bg-violet-100 border-violet-600 dark:bg-violet-900/20",
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
						<Label htmlFor="new-email-title" className="font-medium text-sm">
							Title
						</Label>
						<Input
							id="new-email-title"
							placeholder={placeholder}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
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
