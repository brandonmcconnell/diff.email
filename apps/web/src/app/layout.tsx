import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "diff-email",
	description: "diff-email",
	icons: {
		icon: [
			{
				url: "/favicon.ico",
				type: "image/x-icon",
				sizes: "48x48",
			},
			{
				url: "/favicon.svg",
				type: "image/svg+xml",
				sizes: "any",
			},
			{
				url: "/favicon.png",
				type: "image/png",
				sizes: "32x32",
			},
		],
		shortcut: "/favicon.ico",
		apple: [
			{
				url: "/apple-touch-icon.png",
				type: "image/png",
				sizes: "180x180",
			},
		],
	},
	appleWebApp: {
		capable: true,
		title: "diff.email",
		statusBarStyle: "black-translucent",
	},
	manifest: "/site.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr] pt-16">
						<Header className="h-16" />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
