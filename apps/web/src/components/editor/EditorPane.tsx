"use client";
import Editor from "@monaco-editor/react";
import type { editor as Monaco } from "monaco-editor";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

interface MonacoEditorPropsMinimal {
	theme?: string;
	language?: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
	options?: Monaco.IStandaloneEditorConstructionOptions;
	className?: string;
}

interface Props {
	value: string;
	onChange: (v: string | undefined) => void;
}

export function EditorPane({ value, onChange }: Props) {
	const { theme } = useTheme();
	return (
		<div className="h-full w-full border-r">
			<Editor
				theme={theme === "dark" ? "vs-dark" : "light"}
				language="html"
				value={value}
				onChange={onChange}
				options={{
					scrollBeyondLastLine: false,
					automaticLayout: true,
				}}
			/>
		</div>
	);
}
