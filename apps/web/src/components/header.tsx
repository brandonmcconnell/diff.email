"use client";

import HomeLink from "@/components/home-link";
import { Logo } from "@/components/pro-blocks/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

export function Header_OLD() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
	];

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} href={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}

interface HeaderProps {
	className?: string;
}

export default function Header({ className }: HeaderProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const pathname = usePathname();

	// Get current auth session (client-side)
	const { data: session, isPending } = authClient.useSession();
	const isHome = pathname === "/" || pathname.startsWith("/home");

	const toggleMenu = () => setIsMenuOpen((prev) => !prev);

	const MENU_ITEMS = [
		{ label: "Features", id: "features" },
		// { label: "Testimonials", id: "testimonials" },
		// { label: "Pricing", id: "pricing" },
		{ label: "FAQ", id: "faq" },
	] as const;

	interface NavMenuItemsProps {
		className?: string;
	}

	const NavMenuItems = ({ className }: NavMenuItemsProps) => (
		<div className={`flex flex-col gap-1 md:flex-row ${className ?? ""}`}>
			{MENU_ITEMS.map(({ label, id }) => (
				<HomeLink key={id} id={id} className="w-full md:w-auto">
					<Button variant="ghost" className="w-full md:w-auto">
						{label}
					</Button>
				</HomeLink>
			))}
		</div>
	);

	return (
		<nav
			className={cn(
				"fixed top-0 isolate z-50 flex w-full items-center border-border border-b bg-background",
				className,
			)}
		>
			<div className="container relative m-auto flex flex-col justify-between gap-4 px-6 md:flex-row md:items-center md:gap-6">
				<div className="flex justify-between">
					<HomeLink id="top" aria-label="diff.email">
						<Logo width={128} />
					</HomeLink>
					<Button
						variant="ghost"
						className="flex size-9 items-center justify-center md:hidden"
						onClick={toggleMenu}
						aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					>
						{isMenuOpen ? <X /> : <Menu />}
					</Button>
				</div>

				{/* Desktop Navigation */}
				<div className="hidden w-full flex-row justify-end gap-5 md:flex">
					<NavMenuItems />
					{isPending ? (
						<span className="w-24" />
					) : session ? (
						<UserMenu />
					) : (
						<div className="flex gap-2">
							<Link href="/sign-in">
								<Button variant="outline">Sign in</Button>
							</Link>
							<Link href="/sign-up">
								<Button>Get started</Button>
							</Link>
						</div>
					)}
				</div>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div className="flex w-full flex-col justify-end gap-5 pb-2.5 md:hidden">
						<NavMenuItems />
						{isPending ? null : session ? (
							<UserMenu />
						) : (
							<div className="flex flex-col gap-2">
								<Link href="/sign-in">
									<Button variant="outline" className="w-full">
										Sign in
									</Button>
								</Link>
								<Link href="/sign-up">
									<Button className="w-full">Get started</Button>
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</nav>
	);
}
