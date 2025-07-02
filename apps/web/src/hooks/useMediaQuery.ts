import { useEffect, useState } from "react";

/**
 * useMediaQuery – returns a boolean that reflects whether the supplied media
 * query currently matches. The hook is safe to call during SSR; it returns
 * `false` until the component is mounted on the client.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mql = window.matchMedia(query);
		const handler = (event: MediaQueryListEvent): void => {
			setMatches(event.matches);
		};

		// Update immediately in case it changed after first render.
		setMatches(mql.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [query]);

	return matches;
}
