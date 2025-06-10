import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
	const [state, setState] = useState<T>(() => {
		if (typeof window === "undefined") return defaultValue;
		try {
			const raw = sessionStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : defaultValue;
		} catch (_) {
			return defaultValue;
		}
	});

	useEffect(() => {
		try {
			sessionStorage.setItem(key, JSON.stringify(state));
		} catch (_) {
			/* ignore */
		}
	}, [key, state]);

	return [state, setState] as const;
}
