"use client";

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
import { HeartHandshake } from "lucide-react";

export default function BillingSettingsPage() {
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
								<Label htmlFor="nameOnCard">Name on card</Label>
								<Input id="nameOnCard" disabled placeholder="John Doe" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="cardNumber">Card number</Label>
								<Input
									id="cardNumber"
									disabled
									placeholder="•••• •••• •••• ••••"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="expiry">Expiry</Label>
								<Input id="expiry" disabled placeholder="MM / YYYY" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="cvv">CVV</Label>
								<Input id="cvv" disabled placeholder="•••" />
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
								<Label htmlFor="clientName">Client name</Label>
								<Input id="clientName" disabled placeholder="John Doe" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="emailAddress">Email address</Label>
								<Input
									id="emailAddress"
									disabled
									placeholder="john@example.com"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="country">Country</Label>
								<Input id="country" disabled placeholder="United States" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="address">Street address</Label>
								<Input id="address" disabled placeholder="1234 Main St" />
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
