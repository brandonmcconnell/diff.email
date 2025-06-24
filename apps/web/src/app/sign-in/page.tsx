"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) return;
		if (session) {
			redirect("/dashboard");
		}
	}, [session, isPending]);

	if (isPending) {
		return <Loader />;
	}

	return <SignInForm onSwitchToSignUp={() => redirect("/sign-up")} />;
}
