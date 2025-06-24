"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/pro-blocks/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Logomark } from "./pro-blocks/logomark";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

interface HeaderProps {
	className?: string;
}

interface NavMenuItemsProps {
	className?: string;
	isPending: boolean;
	hasSession: boolean;
}

const NavMenuItems = ({
	className,
	isPending,
	hasSession,
}: NavMenuItemsProps) => {
	const MENU_ITEMS = isPending
		? []
		: hasSession
			? [{ label: "Dashboard", href: "/dashboard" }]
			: ([
					{ label: "Features", href: "/home#features" },
					// { label: "Testimonials", href: "/home#testimonials" },
					// { label: "Pricing", href: "/home#pricing" },
					{ label: "FAQ", href: "/home#faq" },
				] as const);

	return (
		<div className={`flex flex-col gap-1 md:flex-row ${className ?? ""}`}>
			{MENU_ITEMS.map(({ label, href }) => (
				<Button
					variant="ghost"
					className="w-full md:w-auto"
					key={label + href}
					asChild
				>
					<Link href={href}>{label}</Link>
				</Button>
			))}
		</div>
	);
};

export default function Header({ className }: HeaderProps) {
	const pathname = usePathname();
	const isHome = pathname.startsWith("/home");
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Get current auth session (client-side)
	const { data: session, isPending } = authClient.useSession();

	const toggleMenu = () => setIsMenuOpen((prev) => !prev);

	return (
		<nav
			className={cn(
				"fixed top-0 isolate z-50 flex w-full items-center border-border border-b bg-background",
				className,
			)}
		>
			<div className="container relative m-auto flex px-4 md:flex-row md:items-center md:gap-2 lg:px-6">
				<div className="flex flex-1 justify-between">
					<Link
						href={session ? "/dashboard" : isHome ? "#top" : "/home"}
						aria-label="diff.email"
					>
						{!session && <Logo width={128} className="max-sm:hidden" />}
						<Logomark width={32} className={cn(!session && "sm:hidden")} />
					</Link>
					<Button
						variant="outline"
						className={cn(
							"flex h-9 items-center justify-center px-3 md:hidden",
							isMenuOpen && "max-md:bg-muted",
						)}
						onClick={toggleMenu}
						aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					>
						{isMenuOpen ? <X /> : <Menu />} Menu
					</Button>
				</div>

				<div
					className={cn(
						// Universal styles
						"flex w-full gap-5",
						session ? "justify-between" : "justify-end",
						// Mobile menu styles
						"max-md:fixed max-md:top-16 max-md:left-0 max-md:flex-col max-md:gap-1",
						"max-md:bg-background max-md:px-[inherit] max-md:pt-2.5 max-md:pb-3.5",
						"max-md:border-border max-md:border-b",
						"max-md:-z-1 max-md:shadow-lg",
						// Hide mobile menu if not open
						isMenuOpen ? null : "max-md:hidden!",
					)}
				>
					<NavMenuItems isPending={isPending} hasSession={Boolean(session)} />
					{isPending ? (
						<span className="w-24 max-md:hidden" />
					) : session ? (
						<UserMenu />
					) : (
						<div className="flex gap-2 max-md:flex-col">
							<Button variant="outline" asChild>
								<Link href="/sign-in" className="max-md:w-full">
									Sign in
								</Link>
							</Button>
							<Button asChild>
								<Link href="/sign-up" className="max-md:w-full">
									Get started
								</Link>
							</Button>
						</div>
					)}
				</div>
				{/* TODO: Add mode toggle back in, need to figure out the right style and placement */}
				{/* <ModeToggle /> */}
			</div>
		</nav>
	);
}
