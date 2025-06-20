import { cn } from "@/lib/utils";
import { Atom, CodeXml } from "lucide-react";
import { Badge } from "./ui/badge";

export function LanguageBadge({
	language,
	size = "sm",
}: { language: "html" | "jsx"; size?: "sm" | "md" }) {
	const LanguageIcon = language === "html" ? CodeXml : Atom;
	return (
		<Badge
			variant="secondary"
			className={cn(
				"rounded-full bg-current/15 font-mono font-semibold tracking-wide dark:bg-current/25",
				language === "html" && "text-emerald-600 dark:text-emerald-400",
				language === "jsx" && "text-violet-600 dark:text-violet-400",
				{
					sm: "text-xs",
					md: "text-sm",
				}[size],
			)}
		>
			<LanguageIcon
				className={
					{
						sm: "size-3! min-h-3! min-w-3!",
						md: "size-4! min-h-4! min-w-4!",
					}[size]
				}
			/>
			{language.toUpperCase()}
		</Badge>
	);
}
