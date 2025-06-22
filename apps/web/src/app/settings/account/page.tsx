"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getGravatarUrl } from "@/lib/gravatar";
import { trpc } from "@/utils/trpc";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

export default function AccountSettingsPage() {
	const { session } = useRequireAuth();

	const avatarUrl = useMemo(() => {
		const email = session?.user.email ?? "placeholder@example.com";
		return getGravatarUrl(email, 80);
	}, [session?.user.email]);

	// @ts-ignore firstName/lastName added in backend, typing not regenerated yet
	const [firstName, setFirstName] = useState(session?.user.firstName ?? "");
	// @ts-ignore
	const [lastName, setLastName] = useState(session?.user.lastName ?? "");
	const [email, setEmail] = useState(session?.user.email ?? "");

	type ProfileClient = {
		profile: {
			update: (input: {
				firstName: string;
				lastName: string;
				email: string;
			}) => Promise<unknown>;
		};
	};

	async function handleSave() {
		try {
			await (trpc as unknown as ProfileClient).profile.update({
				firstName,
				lastName,
				email,
			});
		} catch (e: unknown) {
			console.error(e);
		}
	}

	return (
		<div className="container mx-auto flex flex-col gap-6 p-4 md:gap-8 md:p-6">
			{/* Avatar section */}
			<Card>
				<CardHeader>
					<h2 className="font-semibold text-lg md:text-xl">Avatar</h2>
					<p className="text-muted-foreground text-sm">
						We use your{" "}
						<a
							href="https://gravatar.com"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							Gravatar
						</a>{" "}
						image. Update it on Gravatar and it will change here automatically.
					</p>
				</CardHeader>
				<CardContent className="flex items-center gap-4">
					<Avatar className="size-14 border border-border md:size-16">
						<img
							src={avatarUrl}
							alt={session?.user.name ?? "avatar"}
							className="h-full w-full rounded"
						/>
					</Avatar>
					<Button
						asChild
						variant="outline"
						className="flex h-13! items-center gap-3 px-3! md:h-10!"
						size="default"
					>
						<a
							href="https://gravatar.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<div className="flex items-start leading-tight max-md:flex-col md:items-baseline md:gap-1">
								<span className="font-medium">Update avatar</span>
								<span className="text-muted-foreground text-xs">
									on Gravatar
								</span>
							</div>
							<ExternalLink className="h-4 w-4 text-muted-foreground" />
						</a>
					</Button>
				</CardContent>
			</Card>

			{/* Name & Email section */}
			<Card>
				<CardHeader>
					<h2 className="font-semibold text-lg md:text-xl">Profile</h2>
					<p className="text-muted-foreground text-sm">
						Update your personal information.
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="firstName">First name</Label>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="email">Email address</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end border-t">
					<Button onClick={handleSave}>Save</Button>
				</CardFooter>
			</Card>

			{/* Delete account section */}
			<Card>
				<CardHeader>
					<h2 className="font-semibold text-xl">Delete account</h2>
					<p className="text-muted-foreground text-sm">
						This will permanently delete your account. This action is
						irreversible.
					</p>
				</CardHeader>
				<CardFooter className="flex flex-col items-start justify-between gap-3 border-t md:flex-row md:items-center">
					<p className="text-destructive text-sm">
						This action cannot be undone!
					</p>
					<Button variant="destructive">Delete account</Button>
				</CardFooter>
			</Card>

			<Separator />
		</div>
	);
}
