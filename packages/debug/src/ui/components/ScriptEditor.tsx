import { useState } from "react";
import { stringify } from "../entryUtils";
import type { DebugEntry, ExecutionState } from "../types";
import { CodeEditor } from "./CodeEditor";

const compileScript = (source: string) =>
	new Function("entry", "capturedResponse", `"use strict";\nreturn (async () => {\n${source}\n})();`) as (
		entry: DebugEntry,
		capturedResponse: unknown,
	) => Promise<unknown>;

const readResponseValue = async (value: unknown) => {
	if (!(value instanceof Response)) return value;
	const response = value.clone();
	const contentType = response.headers.get("content-type") ?? "";
	const payload = contentType.includes("application/json")
		? await response.json().catch(() => null)
		: await response.text();
	return { payload, status: response.status };
};

const IDLE: ExecutionState = { status: "idle" };

type Props = {
	entry: DebugEntry;
	script: string;
	onScriptChange: (script: string) => void;
};

export const ScriptEditor = ({ entry, script, onScriptChange }: Props) => {
	const [state, setState] = useState<ExecutionState>(IDLE);

	const run = async () => {
		setState({ status: "loading" });
		const fn = compileScript(script);
		const value = await readResponseValue(await fn(entry, entry.response));
		setState({ status: "done", value });
	};

	const running = state.status === "loading";

	return (
		<section className="grid min-h-[260px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded border border-[#d9e0ea] bg-white">
			<div className="flex items-center gap-3 border-[#e7ebf1] border-b px-3 py-2">
				<div className="font-semibold text-sm">JavaScript</div>
				<button
					className="ml-auto h-8 rounded bg-[#14532d] px-3 font-semibold text-sm text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#aab4c1]"
					disabled={running}
					type="button"
					onClick={run}
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
			<ResultPanel state={state} />
		</section>
	);
};

const ResultPanel = ({ state }: { state: ExecutionState }) => {
	if (state.status === "idle") return null;
	if (state.status === "loading") {
		return <div className="border-[#e7ebf1] border-t p-3 text-[#536173] text-xs">Running…</div>;
	}
	return (
		<div className="border-[#e7ebf1] border-t">
			<CodeEditor
				className="max-h-[200px] overflow-auto"
				language="json"
				readOnly={true}
				value={stringify(state.value)}
			/>
		</div>
	);
};
