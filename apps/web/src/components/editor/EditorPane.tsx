"use client";
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

// Dynamically load Monaco while keeping full prop typing.
const MonacoEditor = dynamic<MonacoEditorPropsMinimal>(
	() => import("@monaco-editor/react").then((mod) => mod.default),
	{ ssr: false },
);

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
