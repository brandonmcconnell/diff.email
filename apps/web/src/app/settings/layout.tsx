"use client";

import Loader from "@/components/loader";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsLayoutProps {
	readonly children: React.ReactNode;
}

const NAV_ITEMS = [
	{ label: "Account", href: "/settings/account" },
	{ label: "Security", href: "/settings/security" },
	{ label: "Plan", href: "/settings/plan" },
	{ label: "Billing", href: "/settings/billing" },
] as const satisfies ReadonlyArray<{ label: string; href: string }>;

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	const { isPending, session } = useRequireAuth();
	const pathname = usePathname();

	return (
		<div className="grid h-full grid-rows-[auto_1fr]">
			{isPending || !session ? (
				<div className="flex h-full w-full items-center justify-center">
					<Loader />
				</div>
			) : (
				<>
					{/* Sub-navigation bar */}
					<nav className="border-border border-b bg-background shadow-sm">
						<div className="container mx-auto flex overflow-x-auto px-4 lg:px-6">
							{NAV_ITEMS.map(({ label, href }) => {
								const isActive = pathname.startsWith(href);
								return (
									<Link
										key={href}
										href={href}
										className={cn(
											"flex-shrink-0 py-1.5 font-medium text-sm transition-colors",
											isActive
												? "border-primary border-b-2 text-foreground"
												: "text-muted-foreground",
										)}
									>
										<span
											className={cn(
												"block rounded-md px-2.5 py-2 hover:bg-muted",
											)}
										>
											{label}
										</span>
									</Link>
								);
							})}
						</div>
					</nav>

					{/* Page content */}
					<div className="overflow-y-auto">{children}</div>
				</>
			)}
		</div>
	);
}
