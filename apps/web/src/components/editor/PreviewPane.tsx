"use client";
import { useEffect, useRef } from "react";
import type { Engine, Client } from "@diff-email/shared";

interface Props {
	html: string;
	engine: Engine;
	client: Client;
	mode: "live" | "screenshot";
	dark: boolean;
	screenshotUrl?: string;
}

export function PreviewPane({ html, mode, dark }: Props) {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (mode === "live" && iframeRef.current) {
			iframeRef.current.srcdoc = html;
		}
	}, [html, mode]);

	if (mode === "screenshot") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-muted">
				<p className="text-sm text-muted-foreground">Screenshots TBD…</p>
			</div>
		);
	}

	return <iframe title="Preview" ref={iframeRef} className="h-full w-full" />;
} 