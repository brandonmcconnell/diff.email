"use client";

import { Logomark } from "@/components/pro-blocks/logomark";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	ArrowLeftRight,
	ArrowRight,
	Check,
	Combine,
	Database,
	Info,
	ListTodo,
	Menu,
	PenLine,
	Rotate3D,
	Workflow,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";

// Pricing data
const pricingData = {
	plans: [
		{
			name: "Free",
			description: "Perfect for trying diff.email on personal projects.",
			features: [
				{
					name: "1 project",
					tooltip: "Create a single project to experiment with diff.email.",
				},
				{
					name: "3 screenshot runs / month",
					tooltip: "Run up to three full screenshot batches every month.",
				},
				{
					name: "Live preview iframe",
					tooltip: "Instantly see your HTML update as you type.",
				},
			],
			pricing: {
				monthly: 0,
				annually: 0,
			},
			variant: "secondary",
		},
		{
			name: "Pro",
			description: "Unlimited runs and advanced tooling for professionals.",
			badge: "Most popular",
			features: [
				{
					name: "Unlimited projects",
					tooltip: "Organize as many client or side-projects as you like.",
				},
				{
					name: "Unlimited screenshot runs",
					tooltip: "Generate pixel-perfect screenshots whenever you need.",
				},
				{
					name: "HTML diff viewer",
					tooltip: "Quickly compare any two versions to spot changes.",
				},
				{
					name: "Team sharing (coming soon)",
					tooltip: "Invite team-mates to collaborate in real-time.",
				},
			],
			pricing: {
				monthly: 29,
				annually: 290,
			},
			variant: "default",
		},
		{
			name: "Enterprise",
			description: "White-glove support & custom limits for large senders.",
			features: [
				{
					name: "Dedicated support",
					tooltip: "Slack channel & guaranteed 24-hour response time.",
				},
				{
					name: "Custom screenshot capacity",
					tooltip: "We scale to match your volume and retention needs.",
				},
				{
					name: "Single-sign-on",
					tooltip: "SAML & Okta integration for easy user management.",
				},
				{
					name: "On-prem option",
					tooltip: "Run diff.email inside your own VPC if required.",
				},
			],
			pricing: {
				monthly: 129,
				annually: 1290,
			},
			variant: "secondary",
		},
	],
};

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<main>
				<HeroSection7 />
				<FeatureSection9 />
				<FeatureSection3 />
				{/* <TestimonialsSection5 /> */}
				{/* <PricingSection4 /> */}
				<FaqSection1 />
			</main>
			<Footer2 />
		</div>
	);
}

function HeroSection7() {
	return (
		<section
			className="pattern-background-lp-1-example section-padding-y bg-background"
			id="top"
			aria-labelledby="hero-heading"
		>
			<div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:gap-16">
				<div className="flex gap-12 lg:gap-16">
					<div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:gap-8">
						<h1
							id="hero-heading"
							className="heading-xl flex-1 text-balance font-medium text-foreground antialiased"
						>
							Test your emails before you send them.
						</h1>
						<div className="flex w-full flex-1 flex-col gap-8">
							<p className="text-base text-muted-foreground lg:text-lg">
								Stop guessing how your email will render. Add your source code
								and get real screenshots from Gmail, Outlook, Yahoo & more.
							</p>

							<div className="flex flex-col gap-3 lg:flex-row">
								<Button asChild>
									<Link href="/sign-up">Get started free</Link>
								</Button>
								{/* <Button variant="ghost" asChild>
									<Link href="/docs">
										Docs
										<ArrowRight />
									</Link>
								</Button> */}
							</div>
						</div>
					</div>
				</div>
				<AspectRatio ratio={16 / 9}>
					<Image
						src="https://ui.shadcn.com/placeholder.svg"
						alt="Hero section visual"
						fill
						priority
						className="rounded-xl object-cover"
					/>
				</AspectRatio>
			</div>
		</section>
	);
}

function FeatureSection9() {
	return (
		<section id="features" className="bg-muted/40 py-16 md:py-24">
			<div className="container mx-auto flex flex-col gap-12 px-6 md:gap-16">
				<div className="mx-auto flex max-w-xl flex-col gap-4 text-center md:gap-5">
					<p className="font-semibold text-muted-foreground text-sm md:text-base">
						Features
					</p>
					<h2 className="heading-lg text-foreground">Why diff.email?</h2>
					<p className="text-base text-muted-foreground">
						Transform the way your team works with these powerful features:
					</p>
				</div>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
					<div className="flex flex-col items-center gap-5 text-center">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
							<Rotate3D className="h-5 w-5 text-primary" />
						</div>
						<div className="flex flex-col gap-2">
							<h3 className="font-semibold text-foreground">
								Real client screenshots
							</h3>
							<p className="text-balance text-muted-foreground">
								Generate screenshots across Gmail, Outlook, Yahoo & more.
							</p>
						</div>
					</div>
					<div className="flex flex-col items-center gap-5 text-center">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
							<ArrowLeftRight className="h-5 w-5 text-primary" />
						</div>
						<div className="flex flex-col gap-2">
							<h3 className="font-semibold text-foreground">
								Live preview iframe
							</h3>
							<p className="text-balance text-muted-foreground">
								See your HTML update instantly while you type—zero refreshes.
							</p>
						</div>
					</div>
					<div className="flex flex-col items-center gap-5 text-center">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
							<Database className="h-5 w-5 text-primary" />
						</div>
						<div className="flex flex-col gap-2">
							<h3 className="font-semibold text-foreground">
								Version history & diff
							</h3>
							<p className="text-balance text-muted-foreground">
								Every save is versioned so you can compare changes side-by-side.
							</p>
						</div>
					</div>
					<div className="flex flex-col items-center gap-5 text-center">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
							<Combine className="h-5 w-5 text-primary" />
						</div>
						<div className="flex flex-col gap-2">
							<h3 className="font-semibold text-foreground">
								CLI & API (coming soon)
							</h3>
							<p className="text-balance text-muted-foreground">
								Trigger runs from CI or your editor—the pipeline is yours.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function FeatureSection3() {
	return (
		<section className="border-border border-b bg-background py-16 md:py-24">
			<div className="container mx-auto flex flex-col items-center gap-12 px-6 md:gap-16 lg:flex-row">
				<div className="flex flex-1 flex-col gap-8">
					<div className="flex flex-col gap-4 md:gap-5">
						<p className="font-semibold text-muted-foreground text-sm md:text-base">
							Steps
						</p>
						<h2 className="heading-lg text-foreground">
							Getting started is easy!
						</h2>
						<p className="text-base text-muted-foreground">
							In just a few simple steps, you're ready to go:
						</p>
					</div>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
								<PenLine className="h-5 w-5 text-primary" />
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="font-semibold text-foreground">Sign up</h3>
								<p className="text-muted-foreground">
									Create your free account.
								</p>
							</div>
						</div>
						<div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
								<ListTodo className="h-5 w-5 text-primary" />
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="font-semibold text-foreground">
									Set up your workflow
								</h3>
								<p className="text-muted-foreground">
									Paste or import your email HTML / React code.
								</p>
							</div>
						</div>
						<div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs">
								<Workflow className="h-5 w-5 text-primary" />
							</div>
							<div className="flex flex-col gap-2">
								<h3 className="font-semibold text-foreground">
									Start collaborating
								</h3>
								<p className="text-muted-foreground">
									Hit "Run" and review full screenshot grid.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="w-full flex-1">
					<AspectRatio ratio={1}>
						<Image
							src="https://ui.shadcn.com/placeholder.svg"
							alt="Hero image"
							fill
							className="rounded-xl object-cover"
						/>
					</AspectRatio>
				</div>
			</div>
		</section>
	);
}

function TestimonialsSection5() {
	return (
		<section
			id="testimonials"
			className="bg-background py-16 md:py-24"
			aria-labelledby="testimonial-title"
		>
			<div className="container mx-auto px-6">
				<div className="flex flex-col gap-12">
					<div className="flex max-w-xl flex-col gap-4 text-center md:gap-5 md:text-left">
						<p className="font-semibold text-muted-foreground text-sm leading-[20px] md:text-base md:leading-6">
							Testimonials
						</p>
						<h2 id="testimonial-title" className="heading-lg">
							Trusted by the best teams
						</h2>
					</div>

					<div className="flex flex-col gap-8 md:flex-row md:gap-12">
						{/* First Testimonial */}
						<div className="flex flex-col gap-8">
							<p className="text-center font-medium text-foreground text-lg leading-7 md:text-left">
								&quot;diff.email replaced our Litmus subscription and cut our
								review cycle from days to minutes.&quot;
							</p>

							<div className="flex flex-col items-center gap-5 md:flex-row">
								<Avatar className="h-14 w-14">
									<AvatarImage
										src="https://github.com/shadcn.png"
										alt="Kurt Bates"
									/>
									<AvatarFallback>KB</AvatarFallback>
								</Avatar>

								<div className="flex flex-col gap-1 text-center md:text-left">
									<p className="font-semibold text-base text-foreground leading-6">
										Kurt Bates
									</p>
									<p className="text-base text-muted-foreground leading-6">
										Email Developer at BrightIdeas Inc.
									</p>
								</div>
							</div>
						</div>

						<div className="hidden w-[1px] self-stretch bg-border md:block" />
						<Separator
							className="bg-border md:hidden"
							orientation="horizontal"
						/>

						{/* Second Testimonial */}
						<div className="flex flex-col gap-8">
							<p className="text-center font-medium text-foreground text-lg leading-7 md:text-left">
								&quot;Screenshots arrive faster than the coffee brews – every
								stakeholder finally sees the same thing.&quot;
							</p>

							<div className="flex flex-col items-center gap-5 md:flex-row">
								<Avatar className="h-14 w-14">
									<AvatarImage
										src="https://github.com/shadcn.png"
										alt="Alex Buckmaster"
									/>
									<AvatarFallback>AB</AvatarFallback>
								</Avatar>

								<div className="flex flex-col gap-1 text-center md:text-left">
									<p className="font-semibold text-base text-foreground leading-6">
										Alex Buckmaster
									</p>
									<p className="text-base text-muted-foreground leading-6">
										Head of Design at TechWave
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function PricingSection4() {
	const [billingPeriod, setBillingPeriod] = React.useState("monthly");

	return (
		<section
			id="pricing"
			className="pattern-background-lp-1-example bg-muted/40 py-16 md:py-24"
			aria-labelledby="pricing-section-title-4"
		>
			<div className="container mx-auto px-6">
				<div className="flex flex-col items-center gap-8">
					{/* Section Header */}
					<div className="flex max-w-xl flex-col items-center gap-4 text-center md:gap-5">
						<p className="font-semibold text-base text-muted-foreground">
							Pricing
						</p>
						<h2 id="pricing-section-title-4" className="heading-lg">
							Simple, transparent pricing
						</h2>
						<p className="text-base text-muted-foreground">
							Choose a plan that fits your team's needs.
						</p>
					</div>

					{/* Billing Period Toggle Switch */}
					<Tabs
						value={billingPeriod}
						onValueChange={setBillingPeriod}
						className="w-fit"
					>
						<TabsList className="h-10 rounded-[40px] bg-muted p-1">
							<TabsTrigger
								value="monthly"
								className="rounded-full px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								Monthly
							</TabsTrigger>
							<TabsTrigger
								value="annually"
								className="rounded-full px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								Annually
							</TabsTrigger>
						</TabsList>
					</Tabs>

					{/* Horizontal Pricing Cards Layout - Stacks on mobile */}
					<div className="mx-auto flex w-full grid-cols-3 flex-col gap-6 lg:grid lg:max-w-5xl">
						{pricingData.plans.map((plan, index) => (
							<Card
								key={plan.name}
								className={`space-y-8 p-8 ${
									index === 2 ? "bg-foreground text-background" : ""
								}`}
							>
								{/* Plan Content Container */}
								<div className="space-y-6">
									{/* Plan Title and Description Block */}
									<div className="space-y-3">
										<h3 className="font-semibold text-lg leading-7">
											{plan.name}
										</h3>
										<p
											className={`text-sm leading-5 ${
												index === 2 ? "opacity-70" : "text-muted-foreground"
											}`}
										>
											{plan.description}
										</p>
									</div>

									{/* Price Display with Currency and Period */}
									<div className="flex items-end gap-0.5">
										<span className="font-semibold text-4xl leading-10">
											$
											{billingPeriod === "monthly"
												? plan.pricing.monthly
												: plan.pricing.annually}
										</span>
										<span
											className={`text-base leading-6 ${
												index === 2 ? "opacity-70" : "text-muted-foreground"
											}`}
										>
											/{billingPeriod === "monthly" ? "month" : "year"}
										</span>
									</div>

									{/* Call-to-Action Button */}
									<Button
										variant={index === 2 ? "secondary" : "default"}
										className="w-full"
									>
										Purchase plan
									</Button>
								</div>

								{/* Features List Section */}
								<div className="space-y-4">
									{/* Features Header with Plan Inheritance */}
									<p className="font-medium text-sm">
										{index === 0
											? "What's included:"
											: `Everything in ${pricingData.plans[index - 1].name}, plus:`}
									</p>
									{/* Features Grid with Tooltips */}
									<div className="flex flex-col gap-4">
										{plan.features.map((feature) => (
											<div
												key={feature.name}
												className="flex items-center gap-3"
											>
												<Check
													className={`h-5 w-5 ${
														index === 2 ? "" : "text-primary"
													}`}
												/>
												<span
													className={`flex-1 text-sm ${
														index === 2 ? "opacity-70" : "text-muted-foreground"
													}`}
												>
													{feature.name}
												</span>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<Info
																className={`h-4 w-4 ${
																	index === 2
																		? "opacity-40"
																		: "text-muted-foreground opacity-70"
																}`}
															/>
														</TooltipTrigger>
														<TooltipContent className="max-w-xs">
															<p>{feature.tooltip}</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										))}
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function FaqSection1() {
	return (
		<section
			id="faq"
			className="bg-background py-16 md:py-24"
			aria-labelledby="faq-heading"
		>
			<div className="mx-auto flex max-w-2xl flex-col gap-12 px-6">
				{/* Section Header */}
				<div className="flex flex-col gap-5 text-center">
					<p className="font-semibold text-muted-foreground text-sm md:text-base">
						FAQ
					</p>
					<h1
						id="faq-heading"
						className="font-bold text-3xl text-foreground md:text-4xl"
					>
						Got questions? We've got answers.
					</h1>
					<p className="text-muted-foreground">
						We've compiled the most important information to help you get the
						most out of your experience. Can't find what you're looking for?{" "}
						<Link href="#" className="text-primary underline">
							Contact us.
						</Link>
					</p>
				</div>

				{/* FAQ Accordion */}
				<Accordion type="single" defaultValue="item-1" aria-label="FAQ items">
					<AccordionItem value="item-1">
						<AccordionTrigger className="text-left font-medium text-base">
							Is diff.email free to use?
						</AccordionTrigger>
						<AccordionContent className="text-muted-foreground text-sm">
							Yes! Our Free plan lets you run three screenshot batches every
							month—no credit card required.
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-2">
						<AccordionTrigger className="text-left font-medium text-base">
							What clients do you support?
						</AccordionTrigger>
						<AccordionContent className="text-muted-foreground text-sm">
							We spin up real Chromium, Firefox & WebKit browsers logged into
							Gmail, Outlook, Yahoo, AOL and iCloud Mail. More coming soon!
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-3">
						<AccordionTrigger className="text-left font-medium text-base">
							Do you store my email HTML?
						</AccordionTrigger>
						<AccordionContent className="text-muted-foreground text-sm">
							We keep every version so you can diff over time. Delete a version
							at any point and it's gone forever, both from your account and our
							databases.
						</AccordionContent>
					</AccordionItem>

					<AccordionItem value="item-4">
						<AccordionTrigger className="text-left font-medium text-base">
							Can I trigger screenshot runs from CI?
						</AccordionTrigger>
						<AccordionContent className="text-muted-foreground text-sm">
							Absolutely. A REST API and Node.js CLI are in private beta—ping us
							to get access.
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				{/* CTA Card */}
				<div className="flex w-full flex-col items-center gap-6 rounded-xl bg-muted/60 p-6 md:p-8">
					<div className="flex flex-col gap-2 text-center">
						<h2 className="heading-md text-foreground">
							Still have questions?
						</h2>
						<p className="text-base text-muted-foreground">
							Have questions or need assistance? Our team is here to help!
						</p>
					</div>
					{/* TODO: When this is ready...
						– remove the onClick from Button
						– add asChild prop to Button
						– uncomment the <Link> */}
					<Button
						aria-label="Contact our support team"
						onClick={() => {
							alert("This is a placeholder for the contact us action");
						}}
					>
						{/* <Link href="mailto:support@diff.email"> */}
						Contact us
						{/* </Link> */}
					</Button>
				</div>
			</div>
		</section>
	);
}

function Footer2() {
	return (
		<footer
			className="border-border border-t bg-muted/40 py-16 lg:py-24"
			aria-label="Site footer"
		>
			<div className="container mx-auto flex flex-col gap-12 px-6 lg:gap-16">
				<div className="flex flex-col gap-12">
					{/* Top Section */}
					<div className="flex flex-col gap-12 md:items-center md:justify-between lg:flex-row">
						{/* Logo and Navigation */}
						<div className="flex flex-col items-center gap-12 lg:flex-row">
							<Link href="/home#top" aria-label="diff.email">
								<Logomark width={32} />
							</Link>

							{/* Main Navigation */}
							<nav
								className="flex flex-col items-center gap-6 text-center md:flex-row md:gap-8"
								aria-label="Footer navigation"
							>
								<a
									href="#top"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Home
								</a>
								<a
									href="#features"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Features
								</a>
								{/* <a
									href="#testimonials"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Testimonials
								</a> */}
								{/* <a
									href="#pricing"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									Pricing
								</a> */}
								<a
									href="#faq"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									FAQ
								</a>
							</nav>
						</div>

						{/* Newsletter Form */}
						<form
							className="flex w-full flex-col gap-2 md:w-auto md:flex-row"
							onSubmit={(e) => e.preventDefault()}
							aria-label="Newsletter subscription form"
						>
							<Input
								type="email"
								placeholder="Your email"
								className="bg-background md:w-[242px]"
								required
								aria-required="true"
								aria-label="Enter your email for newsletter"
							/>
							{/* TODO: When this is ready remove the onClick set type="submit" */}
							<Button
								type="button"
								className="w-full md:w-auto"
								aria-label="Subscribe to our newsletter"
								onClick={() => {
									alert("This is a placeholder for the subscribe action");
								}}
							>
								Subscribe
							</Button>
						</form>
					</div>

					<Separator role="presentation" />

					{/* Bottom Section */}
					<div className="flex flex-col items-center justify-between gap-12 text-center lg:flex-row">
						<p className="order-2 text-muted-foreground md:order-1">
							<span>Copyright &copy; {new Date().getFullYear()}</span>{" "}
							<Link href="/home" className="hover:underline">
								diff.email
							</Link>
							. All rights reserved.
						</p>

						<nav
							className="order-1 flex flex-col items-center gap-6 md:order-2 md:flex-row md:gap-8"
							aria-label="Legal links"
						>
							<Link
								href="/privacy"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Privacy Policy
							</Link>
							<Link
								href="/terms"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Terms of Service
							</Link>
							<Link
								href="/cookies-settings"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								Cookies Settings
							</Link>
						</nav>
					</div>
				</div>
			</div>
		</footer>
	);
}
