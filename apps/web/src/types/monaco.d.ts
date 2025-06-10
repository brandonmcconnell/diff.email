declare module "@monaco-editor/react" {
	import type * as React from "react";
	import type * as monaco from "monaco-editor";

	export interface MonacoEditorProps {
		height?: number | string;
		width?: number | string;
		language?: string;
		value?: string;
		defaultValue?: string;
		theme?: string;
		options?: monaco.editor.IStandaloneEditorConstructionOptions;
		onChange?: (
			value: string | undefined,
			ev: monaco.editor.IModelContentChangedEvent,
		) => void;
	}

	const Editor: React.FC<MonacoEditorProps>;
	export default Editor;
}
