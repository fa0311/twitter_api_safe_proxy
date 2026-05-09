import type { ExecutionState } from "../types";
import { CodeEditor } from "./CodeEditor";

type ScriptEditorProps = {
	executionState?: ExecutionState;
	onExecute: () => void;
	onScriptChange: (value: string) => void;
	script: string;
};

export function ScriptEditor({ executionState, onExecute, onScriptChange, script }: ScriptEditorProps) {
	const running = executionState?.status === "loading";

	return (
		<section className="grid min-h-[260px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded border border-[#d9e0ea] bg-white">
			<div className="flex items-center gap-3 border-[#e7ebf1] border-b px-3 py-2">
				<div className="font-semibold text-sm">JavaScript</div>
				<button
					className="ml-auto h-8 rounded bg-[#14532d] px-3 font-semibold text-sm text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#aab4c1]"
					disabled={running}
					type="button"
					onClick={onExecute}
				>
					{running ? "Running" : "Execute"}
				</button>
			</div>
			<CodeEditor
				className="min-h-0 overflow-hidden"
				language="javascript"
				readOnly={false}
				value={script}
				onChange={onScriptChange}
			/>
		</section>
	);
}
