"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic<any>(() => import("@monaco-editor/react"), {
	ssr: false,
});

interface Props {
	value: string;
	onChange: (v: string | undefined) => void;
}

export function EditorPane({ value, onChange }: Props) {
	const { theme } = useTheme();
	return (
		<div className="h-full w-full border-r">
			<MonacoEditor
				theme={theme === "dark" ? "vs-dark" : "light"}
				language="html"
				value={value}
				onChange={onChange}
				options={{
					scrollBeyondLastLine: false,
					automaticLayout: true,
				}}
				className="h-full w-full"
			/>
		</div>
	);
} 