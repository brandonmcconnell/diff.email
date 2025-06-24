"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
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

	return <SignUpForm onSwitchToSignIn={() => redirect("/sign-in")} />;
}
