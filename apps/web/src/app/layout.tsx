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
				url: "/images/favicons/favicon.svg",
				type: "image/svg+xml",
				sizes: "any",
			},
			{
				url: "/images/favicons/apple-touch-icon-96x96.png",
				type: "image/png",
				sizes: "96x96",
			},
		],
		apple: [
			{
				url: "/images/favicons/apple-touch-icon-180x180.png",
				type: "image/png",
				sizes: "180x180",
			},
			{
				url: "/images/favicons/apple-touch-icon-192x192.png",
				type: "image/png",
				sizes: "192x192",
			},
			{
				url: "/images/favicons/apple-touch-icon-256x256.png",
				type: "image/png",
				sizes: "256x256",
			},
			{
				url: "/images/favicons/apple-touch-icon-512x512.png",
				type: "image/png",
				sizes: "512x512",
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
