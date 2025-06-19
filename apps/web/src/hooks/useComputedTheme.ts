import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

interface Result {
	theme: ThemeMode;
	label: "Light" | "Dark";
}

/**
 * useComputedTheme – returns the effective light/dark mode even when user
 * selects "system" in next-themes. Exposes a stable `theme` ("light" | "dark")
 * and a capitalised `label` string for UI.
 */
export function useComputedTheme(): Result {
	const { theme, resolvedTheme } = useTheme();
	const [mode, setMode] = useState<ThemeMode>(
		() => (resolvedTheme as ThemeMode) || "light",
	);

	useEffect(() => {
		if (theme === "system") {
			const mq = window.matchMedia("(prefers-color-scheme: dark)");
			const update = () => setMode(mq.matches ? "dark" : "light");
			update();
			mq.addEventListener("change", update);
			return () => mq.removeEventListener("change", update);
		}
		setMode(theme as ThemeMode);
	}, [theme]);

	return { theme: mode, label: mode === "dark" ? "Dark" : "Light" };
}
