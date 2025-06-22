"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface BetaBannerProps {
	title: React.ReactNode;
	subtitle: string;
	icon: LucideIcon;
	className?: string;
}

export default function BetaBanner({
	title,
	subtitle,
	icon: Icon,
	className,
}: BetaBannerProps) {
	return (
		<Card className={cn("bg-primary text-primary-foreground", className)}>
			<CardContent className="flex flex-col items-start justify-between gap-2 px-6 md:flex-row md:items-center md:gap-4">
				<Icon className="size-12 flex-shrink-0 text-muted-foreground md:order-1" />
				<div>
					<h3 className="flex items-center gap-2 font-semibold text-base md:text-lg">
						{title}
					</h3>
					<p className="mt-1 max-w-prose text-primary-foreground/80 text-sm">
						{subtitle}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
