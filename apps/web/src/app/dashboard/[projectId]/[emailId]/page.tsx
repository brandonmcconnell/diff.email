"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { EditorPane } from "@/components/editor/EditorPane";
import { PreviewPane } from "@/components/editor/PreviewPane";
import { Toolbar } from "@/components/editor/Toolbar";
import { usePersistentState } from "@/utils/usePersistentState";
import type { Client, Engine } from "@diff-email/shared";

export default function EmailEditorPage() {
	const params = useParams<{ projectId: string; emailId: string }>();
	const projectId = params.projectId;
	const emailId = params.emailId;

	const [html, setHtml] = useState<string>("<!-- start editing -->");

	// persistent UI state
	const [engine, setEngine] = usePersistentState<Engine>(
		"ui-engine",
		"chromium",
	);
	const [client, setClient] = usePersistentState<Client>("ui-client", "gmail");
	const [mode, setMode] = usePersistentState<"live" | "screenshot">("ui-mode", "live");
	const [dark, setDark] = usePersistentState<boolean>("ui-dark", false);

	return (
		<div className="flex h-[calc(100vh_-_3rem)] w-full">
			<div className="w-1/2">
				<EditorPane value={html} onChange={(v) => setHtml(v ?? "")} />
			</div>
			<div className="flex w-1/2 flex-col">
				<Toolbar
					engine={engine}
					setEngine={setEngine}
					client={client}
					setClient={setClient}
					mode={mode}
					setMode={setMode}
					dark={dark}
					setDark={setDark}
				/>
				<PreviewPane
					html={html}
					engine={engine}
					client={client}
					mode={mode}
					dark={dark}
				/>
			</div>
		</div>
	);
} 