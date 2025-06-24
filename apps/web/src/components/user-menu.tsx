import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { getGravatarUrl, placeholderUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "./image-with-fallback";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

type User = typeof auth.$Infer.Session.user;

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	console.log("session", session);

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

	const avatarUrl = getGravatarUrl(session.user.email, 128);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-2.5 py-0 pr-2.5 pl-0.5"
				>
					<ImageWithFallback
						fallbackSrc={placeholderUrl}
						src={avatarUrl}
						alt={session.user.name ?? "avatar"}
						width={30}
						height={30}
						unoptimized
						className="size-7.5 rounded-sm border border-border object-cover"
						fallbackClassName="border-none"
					/>
					<span>Hi, {(session.user as User).firstName} 👋</span>
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
