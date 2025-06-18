"use client";

import SignUpForm from "@/components/sign-up-form";
import { redirect } from "next/navigation";

export default function SignUpPage() {
	return <SignUpForm onSwitchToSignIn={() => redirect("/sign-in")} />;
}
