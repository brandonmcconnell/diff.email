"use client";

import SignInForm from "@/components/sign-in-form";
import { redirect } from "next/navigation";

export default function SignInPage() {
	return <SignInForm onSwitchToSignUp={() => redirect("/sign-up")} />;
}
