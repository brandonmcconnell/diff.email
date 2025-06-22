"use client";

import { authClient } from "@/lib/auth-client";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

/**
 * Enforces that the user is authenticated before accessing a page.
 *
 * If no session exists the user is redirected to `/sign-in` and the
 * current pathname is passed through the `redirect` query parameter so
 * that they can be sent back after completing authentication.
 *
 * Example:
 *   const { session, isPending } = useRequireAuth();
 */
const LOGIN_COOKIE = "diffemail_logged_in";

export function useRequireAuth() {
	const { data: session, isPending } = authClient.useSession();
	const pathname = usePathname();
	const router = useRouter();

	// Quick synchronous check for our login cookie so we know if user was previously authenticated.
	const hasAuthCookie = useMemo(() => {
		if (typeof window === "undefined") return true; // SSR
		return Cookies.get(LOGIN_COOKIE) !== undefined;
	}, []);

	useEffect(() => {
		if (isPending) return;

		if (!session) {
			const encodedPath = encodeURIComponent(pathname);
			// Use replace to avoid history entry for the protected page
			router.replace(`/sign-in?redirect=${encodedPath}`);
		}
	}, [isPending, session, pathname, router]);

	return { session, isPending, hasAuthCookie } as const;
}
