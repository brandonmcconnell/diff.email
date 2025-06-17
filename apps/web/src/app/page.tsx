"use client";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootRedirect() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) return;
		if (session) {
			router.replace("/dashboard");
		} else {
			router.replace("/home");
		}
	}, [session, isPending, router]);

	return <Loader />;
}
