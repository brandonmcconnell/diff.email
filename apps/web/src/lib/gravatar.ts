import md5 from "crypto-js/md5";

// Build absolute URL for placeholder (required by Gravatar)
export const placeholderUrl =
	typeof window !== "undefined"
		? `${window.location.origin}/images/avatar-placeholder.svg`
		: "/images/avatar-placeholder.svg"; // SSR fallback (will be rewritten on client)

export function getGravatarUrl(
	email: string,
	size = 40,
	defaultImage: string = placeholderUrl,
) {
	const trimmed = (email ?? "").trim().toLowerCase();
	const hash = md5(trimmed).toString();

	const d = defaultImage ? encodeURIComponent(defaultImage) : "identicon";

	return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${d}`;
}
