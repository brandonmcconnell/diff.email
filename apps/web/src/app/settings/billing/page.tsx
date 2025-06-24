"use client";

import { HeartHandshake } from "lucide-react";
import { useId } from "react";
import BetaBanner from "@/components/beta-plan-banner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function BillingSettingsPage() {
	const addressId = useId();
	const clientNameId = useId();
	const emailAddressId = useId();
	const countryId = useId();
	const nameOnCardId = useId();
	const cardNumberId = useId();
	const expiryId = useId();
	const cvvId = useId();

	return (
		<div className="container mx-auto flex flex-col gap-6 p-4 md:gap-8 md:p-6">
			{/* Banner */}
			<BetaBanner
				title="You're on the unlimited beta plan."
				subtitle="Billing will be enabled after public launch. Payment details are currently disabled."
				icon={HeartHandshake}
			/>

			{/* Card details (disabled) */}
			<Card className="opacity-60">
				<CardHeader className="px-6 pb-0">
					<CardTitle className="text-xl">Card details</CardTitle>
					<p className="text-muted-foreground text-sm">
						Billing is disabled during beta. Card details are currently
						unavailable.
					</p>
				</CardHeader>
				<CardContent className="px-6">
					<form className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={nameOnCardId}>Name on card</Label>
								<Input id={nameOnCardId} disabled placeholder="John Doe" />
							</div>
							<div className="space-y-2">
								<Label htmlFor={cardNumberId}>Card number</Label>
								<Input
									id={cardNumberId}
									disabled
									placeholder="•••• •••• •••• ••••"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={expiryId}>Expiry</Label>
								<Input id={expiryId} disabled placeholder="MM / YYYY" />
							</div>
							<div className="space-y-2">
								<Label htmlFor={cvvId}>CVV</Label>
								<Input id={cvvId} disabled placeholder="•••" />
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="flex justify-end border-t px-6">
					<Button disabled>Save</Button>
				</CardFooter>
			</Card>

			{/* Client details (disabled) */}
			<Card className="opacity-60">
				<CardHeader className="px-6">
					<CardTitle className="text-xl">Client details</CardTitle>
					<p className="text-muted-foreground text-sm">
						Billing information cannot be updated while billing is disabled.
					</p>
				</CardHeader>
				<CardContent className="px-6">
					<form className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor={clientNameId}>Client name</Label>
								<Input id={clientNameId} disabled placeholder="John Doe" />
							</div>
							<div className="space-y-2">
								<Label htmlFor={emailAddressId}>Email address</Label>
								<Input
									id={emailAddressId}
									disabled
									placeholder="john@example.com"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={countryId}>Country</Label>
								<Input id={countryId} disabled placeholder="United States" />
							</div>
							<div className="space-y-2">
								<Label htmlFor={addressId}>Street address</Label>
								<Input id={addressId} disabled placeholder="1234 Main St" />
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="flex justify-end border-t px-6">
					<Button disabled>Save</Button>
				</CardFooter>
			</Card>

			<Separator />
		</div>
	);
}
