import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "diff-email",
	description: "diff-email",
	icons: {
		icon: [
			{
				url: "/images/favicons/favicon.svg",
				type: "image/svg+xml",
				sizes: "any",
			},
			{
				url: "/images/favicons/touch-icon.png",
				type: "image/png",
				sizes: "96x96",
			},
			{
				url: "/images/favicons/favicon.ico",
				type: "image/x-icon",
				sizes: "any",
			},
		],
		apple: [
			{
				url: "/images/favicons/touch-icon.png",
				type: "image/png",
				sizes: "180x180",
			},
		],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
