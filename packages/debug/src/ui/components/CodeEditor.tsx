import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { defaultHighlightStyle, HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { useEffect, useMemo, useRef } from "react";

type CodeEditorLanguage = "javascript" | "json";

type CodeEditorProps = {
	className?: string;
	language: CodeEditorLanguage;
	onChange?: (value: string) => void;
	readOnly?: boolean;
	value: string;
};

const editorTheme = EditorView.theme({
	"&": {
		backgroundColor: "#fbfcfe",
		caretColor: "#1d4ed8",
		color: "#17202c",
		fontSize: "12px",
		height: "100%",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-activeLine": {
		backgroundColor: "transparent",
	},
	".cm-activeLineGutter": {
		backgroundColor: "#edf3fb",
	},
	".cm-content": {
		minHeight: "100%",
		padding: "12px",
	},
	".cm-content ::selection": {
		backgroundColor: "#9fc4ff",
	},
	".cm-cursor": {
		borderLeftColor: "#1d4ed8",
		borderLeftWidth: "2px",
	},
	".cm-gutters": {
		backgroundColor: "#f4f7fb",
		borderRight: "1px solid #e1e7f0",
		color: "#7a8697",
	},
	".cm-scroller": {
		fontFamily: '"Cascadia Mono", Consolas, "Liberation Mono", monospace',
		lineHeight: "1.55",
		tabSize: "4",
	},
	".cm-selectionLayer .cm-selectionBackground": {
		backgroundColor: "#b5d2ff !important",
	},
	"&.cm-focused .cm-selectionLayer .cm-selectionBackground": {
		backgroundColor: "#8dbbff !important",
	},
});

const syntaxColors: Record<string, string> = {
	"#00c": "#1d4ed8",
	"#00f": "#2563eb",
	"#085": "#047857",
	"#167": "#0e7490",
	"#164": "#047857",
	"#219": "#0f766e",
	"#256": "#334155",
	"#30a": "#6d28d9",
	"#404740": "#536173",
	"#708": "#7c3aed",
	"#940": "#92400e",
	"#a11": "#b42318",
	"#e40": "#c2410c",
	"#f00": "#dc2626",
};

const syntaxColorOf = (color: unknown) => (typeof color === "string" ? syntaxColors[color] : undefined);

const editorHighlightStyle = HighlightStyle.define(
	defaultHighlightStyle.specs.map((spec) => {
		const color = syntaxColorOf(spec.color);
		return color ? { ...spec, color } : spec;
	}),
);

export const CodeEditor = ({ className, language, onChange, readOnly = false, value }: CodeEditorProps) => {
	const hostRef = useRef<HTMLDivElement>(null);
	const initialValueRef = useRef(value);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const extensions = useMemo(
		() => [
			basicSetup,
			EditorState.tabSize.of(4),
			indentUnit.of("\t"),
			language === "javascript" ? javascript() : json(),
			syntaxHighlighting(editorHighlightStyle),
			EditorState.readOnly.of(readOnly),
			EditorView.editable.of(!readOnly),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onChangeRef.current?.(update.state.doc.toString());
				}
			}),
			editorTheme,
		],
		[language, readOnly],
	);

	useEffect(() => {
		if (!hostRef.current) {
			return;
		}

		const view = new EditorView({
			doc: initialValueRef.current,
			extensions,
			parent: hostRef.current,
		});
		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [extensions]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) {
			return;
		}

		const currentValue = view.state.doc.toString();
		if (value === currentValue) {
			return;
		}

		view.dispatch({
			changes: {
				from: 0,
				insert: value,
				to: currentValue.length,
			},
		});
	}, [value]);

	return <div className={className} ref={hostRef} />;
};
