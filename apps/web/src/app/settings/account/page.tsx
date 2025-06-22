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
import { confirmDeletion } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
	const { session } = useRequireAuth();

	const avatarUrl = useMemo(() => {
		const email = session?.user.email ?? "placeholder@example.com";
		return getGravatarUrl(email, 80);
	}, [session?.user.email]);

	useEffect(() => {
		console.log(session);
	}, [session]);

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	// Existing values for placeholders / fallbacks
	const existingFirstName =
		(session?.user as { firstName?: string })?.firstName ?? "";
	const existingLastName =
		(session?.user as { lastName?: string })?.lastName ?? "";
	const existingEmail = session?.user.email ?? "";

	const updateProfile = useMutation(trpc.profile.update.mutationOptions());

	async function handleSave() {
		// If nothing was entered, no-op
		if (![firstName, lastName, email].some((v) => v.trim())) return;

		const payload = {
			firstName: firstName.trim() || existingFirstName,
			lastName: lastName.trim() || existingLastName,
			email: email.trim() || existingEmail,
		} as const;

		await toast.promise(
			async () => {
				await updateProfile.mutateAsync(payload);
			},
			{
				loading: "Saving…",
				success: "Profile updated!",
				error: (err) =>
					typeof err === "string" ? err : ((err as Error)?.message ?? "Error"),
			},
		);
	}

	// Delete account mutation
	const deleteAccount = useMutation(
		trpc.profile.deleteAccount.mutationOptions(),
	);

	async function handleDelete() {
		const userEmail = session?.user.email ?? "your account";
		await confirmDeletion(
			{
				id: session?.user.id ?? "me",
				name: userEmail,
				type: "account",
			},
			async () => {
				await toast.promise(
					async () => {
						await deleteAccount.mutateAsync();
					},
					{
						loading: "Deleting account…",
						success: "Account deleted.",
						error: (err) =>
							typeof err === "string"
								? err
								: ((err as Error)?.message ?? "Error"),
					},
				);
			},
		);
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
								placeholder={existingFirstName}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder={existingLastName}
							/>
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="email">Email address</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={existingEmail}
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end border-t">
					<Button onClick={handleSave} disabled={updateProfile.isPending}>
						{updateProfile.isPending ? (
							<Loader2 className="animate-spin" size={16} />
						) : (
							"Save"
						)}
					</Button>
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
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteAccount.isPending}
					>
						{deleteAccount.isPending ? (
							<Loader2 className="animate-spin" size={16} />
						) : (
							"Delete account"
						)}
					</Button>
				</CardFooter>
			</Card>

			<Separator />
		</div>
	);
}
