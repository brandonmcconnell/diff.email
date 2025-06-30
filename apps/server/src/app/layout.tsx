import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "diff-email",
	description: "diff-email",
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
