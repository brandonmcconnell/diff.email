"use client";

import SignInForm from "@/components/sign-in-form";
import { useRouter } from "next/navigation";

export default function SignInPage() {
	const router = useRouter();
	return <SignInForm onSwitchToSignUp={() => router.push("/sign-up")} />;
}
