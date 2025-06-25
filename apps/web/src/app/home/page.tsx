"use client";

import { ArrowLeftRight, Combine, Database, Rotate3D } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId } from "react";
import { Logomark } from "@/components/pro-blocks/logomark";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<main>
				<HeroSection7 />
				<FeatureSection9 />
				<FaqSection1 />
			</main>
			<Footer2 />
		</div>
	);
}

function HeroSection7() {
	const topId = useId();
	const heroHeadingId = useId();

	return (
		<section
			className="pattern-background-lp-1-example section-padding-y bg-background"
			id={topId}
			aria-labelledby={heroHeadingId}
		>
			<div className="container mx-auto flex flex-col items-center gap-12 px-6 lg:gap-16">
				<div className="flex gap-12 lg:gap-16">
					<div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:gap-8">
						<h1
							id={heroHeadingId}
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
							</div>
						</div>
					</div>
				</div>
				<div>
					<Image
						src="/images/diff-email-hero-light.png"
						alt=""
						width={1039}
						height={735}
						priority
						className="mx-auto rounded-xl border border-neutral-200 object-cover shadow-xl dark:hidden"
						quality={100}
					/>
					<Image
						src="/images/diff-email-hero-dark.png"
						alt=""
						width={1039}
						height={735}
						priority
						className="mx-auto not-dark:hidden rounded-xl border border-neutral-800 object-cover shadow-black shadow-xl"
						quality={100}
					/>
				</div>
			</div>
		</section>
	);
}

function FeatureSection9() {
	const featuresId = useId();
	const featuresHeadingId = useId();

	return (
		<section
			id={featuresId}
			className="bg-muted/40 py-16 md:py-24"
			aria-labelledby={featuresHeadingId}
		>
			<div className="container mx-auto flex flex-col gap-12 px-6 md:gap-16">
				<div className="mx-auto flex max-w-xl flex-col gap-4 text-center md:gap-5">
					<p className="font-semibold text-muted-foreground text-sm md:text-base">
						Features
					</p>
					<h2 id={featuresHeadingId} className="heading-lg text-foreground">
						Why diff.email?
					</h2>
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
								See your HTML update instantly while you type. Zero refreshes.
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
								Trigger runs from CI or your editor. The pipeline is yours.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function FaqSection1() {
	const faqId = useId();
	const faqHeadingId = useId();

	return (
		<section
			id={faqId}
			className="bg-background py-16 md:py-24"
			aria-labelledby={faqHeadingId}
		>
			<div className="mx-auto flex max-w-2xl flex-col gap-12 px-6">
				{/* Section Header */}
				<div className="flex flex-col gap-5 text-center">
					<p className="font-semibold text-muted-foreground text-sm md:text-base">
						FAQ
					</p>
					<h1
						id={faqHeadingId}
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
							month. No credit card required.
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
							Absolutely. A REST API and Node.js CLI are in private beta. Ping
							us to get access.
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
		<footer className="border-border border-t bg-muted/40 py-16 lg:py-24">
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
