"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecuritySettingsPage() {
	const currentPasswordId = useId();
	const newPasswordId = useId();
	const confirmPasswordId = useId();

	return (
		<div className="container mx-auto flex flex-col gap-6 p-4 md:gap-8 md:p-6">
			<Card>
				<CardHeader>
					<h2 className="font-semibold text-lg md:text-xl">Change password</h2>
					<p className="text-muted-foreground text-sm">
						Update your password to keep your account secure.
					</p>
				</CardHeader>
				<CardContent className="max-w-lg space-y-4">
					<div className="space-y-2">
						<Label htmlFor={currentPasswordId}>Current password</Label>
						<Input
							id={currentPasswordId}
							type="password"
							defaultValue=""
							placeholder="••••••••"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={newPasswordId}>New password</Label>
						<Input
							id={newPasswordId}
							type="password"
							defaultValue=""
							placeholder="••••••••"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={confirmPasswordId}>Confirm new password</Label>
						<Input
							id={confirmPasswordId}
							type="password"
							defaultValue=""
							placeholder="••••••••"
						/>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end border-t">
					<Button>Save</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
