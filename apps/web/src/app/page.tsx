"use client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export default function RootRedirect() {
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) return;
		if (session) {
			redirect("/dashboard");
		} else {
			redirect("/home");
		}
	}, [session, isPending]);

	return <Loader />;
}
