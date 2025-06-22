"use client";

import SignInForm from "@/components/sign-in-form";
import { redirect, useSearchParams } from "next/navigation";

export default function SignInPage() {
	const searchParams = useSearchParams();
	const next = searchParams.get("next");

	return (
		<SignInForm
			onSwitchToSignUp={() => redirect("/sign-up")}
			redirectTo={next ? decodeURIComponent(next) : undefined}
		/>
	);
}
