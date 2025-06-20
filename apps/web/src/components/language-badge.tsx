import { cn } from "@/lib/utils";
import { Atom, CodeXml } from "lucide-react";
import { Badge } from "./ui/badge";

export function LanguageBadge({
	language,
	size = "sm",
	badgeOnly = false,
	className,
}: {
	language: "html" | "jsx";
	size?: "sm" | "md";
	badgeOnly?: boolean;
	className?: string;
}) {
	const LanguageIcon = language === "html" ? CodeXml : Atom;
	return (
		<Badge
			variant="secondary"
			className={cn(
				"rounded-full bg-current/15 font-mono font-semibold tracking-wide dark:bg-current/25",
				language === "html" && "text-orange-600 dark:text-orange-400",
				language === "jsx" && "text-indigo-600 dark:text-indigo-500",
				badgeOnly && "aspect-square p-1",
				{
					sm: "text-xs",
					md: "text-sm",
				}[size],
				className,
			)}
		>
			<LanguageIcon
				className={
					{
						sm: "size-3.5! min-h-3.5! min-w-3.5!",
						md: "size-4! min-h-4! min-w-4!",
					}[size]
				}
			/>
			{!badgeOnly && language.toUpperCase()}
		</Badge>
	);
}
