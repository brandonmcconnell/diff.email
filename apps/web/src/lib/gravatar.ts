import md5 from "crypto-js/md5";

export function getGravatarUrl(
	email: string,
	size = 40,
	defaultImage?: string,
) {
	const trimmed = (email ?? "").trim().toLowerCase();
	const hash = md5(trimmed).toString();

	const d = defaultImage ? encodeURIComponent(defaultImage) : "identicon";

	return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${d}`;
}
