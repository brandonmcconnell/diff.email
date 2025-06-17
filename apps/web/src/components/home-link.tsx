"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";

interface HomeLinkProps {
	id: string; // id of section on home page (without #)
	children: React.ReactNode;
	className?: string;
}

export default function HomeLink({
	id,
	children,
	className,
	...LinkProps
}: HomeLinkProps & Omit<React.ComponentProps<typeof Link>, "href">) {
	const pathname = usePathname();
	const isHome = pathname === "/" || pathname.startsWith("/home");
	const href = isHome ? `#${id}` : `/home#${id}`;

	return (
		<Link {...LinkProps} className={className} href={href}>
			{children}
		</Link>
	);
}
