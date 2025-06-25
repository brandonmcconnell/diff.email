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
