"use client";

import SignUpForm from "@/components/sign-up-form";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
	const router = useRouter();
	return <SignUpForm onSwitchToSignIn={() => router.push("/sign-in")} />;
}
