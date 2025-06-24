import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { getGravatarUrl } from "@/lib/gravatar";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Get Started</Link>
			</Button>
		);
	}

	// Build absolute URL for placeholder (required by Gravatar)
	const placeholderUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/avatar-placeholder.svg`
			: "/avatar-placeholder.svg"; // SSR fallback (will be rewritten on client)
	const avatarUrl = getGravatarUrl(session.user.email, 128, placeholderUrl);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-2.5 py-0 pr-2.5 pl-0.5"
				>
					<Image
						src={avatarUrl}
						alt={session.user.name ?? "avatar"}
						width={30}
						height={30}
						unoptimized
						className="size-7.5 rounded-sm border border-border object-cover"
						onError={() => {
							// Fallback handled by next/image loader; placeholder remains if fails
						}}
					/>
					<span>{session.user.name}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem asChild>
					<Link href="/settings">Account Settings</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					onSelect={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									// Remove login marker cookie
									Cookies.remove("diffemail_logged_in", { path: "/" });
									router.push("/");
								},
							},
						});
					}}
				>
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
