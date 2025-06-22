"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface AuthRouteGuardProps {
	children: React.ReactNode;
}

const PUBLIC = new Set(["/", "/home"]);
const AUTH = new Set(["/sign-in", "/sign-up"]);

export default function AuthRouteGuard({ children }: AuthRouteGuardProps) {
	const { data: session, isPending } = authClient.useSession();
	const pathname = usePathname();
	const router = useRouter();
	const checkedRef = useRef(false); // run once per nav

	useEffect(() => {
		if (isPending || checkedRef.current) return;
		checkedRef.current = true; // don't run again for this path

		const isAuthPage = AUTH.has(pathname);
		const isPublic = PUBLIC.has(pathname);

		if (!session) {
			if (!isPublic && !isAuthPage) {
				router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
			}
		} else if (isAuthPage) {
			router.replace("/dashboard");
		}
	}, [session, isPending, pathname, router]);

	// Always render children immediately; redirect happens asynchronously
	return <>{children}</>;
}
