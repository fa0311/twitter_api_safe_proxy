import { countKeys, labelOf, metaOf, methodBadgeClass, stringify } from "../entryUtils";
import type { DebugEntry, DetailTab, ExecutionState } from "../types";
import { CodeEditor } from "./CodeEditor";
import { ScriptEditor } from "./ScriptEditor";

type DetailPaneProps = {
	executionState?: ExecutionState;
	onExecute: () => void;
	onScriptChange: (script: string) => void;
	onTabChange: (tab: DetailTab) => void;
	script: string;
	selected?: DebugEntry;
	tab: DetailTab;
};

const capturedResponseOf = (selected: DebugEntry | undefined) => {
	if (!selected) {
		return undefined;
	}
	if (selected.response !== undefined) {
		return selected.response;
	}
	if (selected.error !== undefined) {
		return { error: selected.error };
	}
	return undefined;
};

const responsePayloadOf = (selected: DebugEntry | undefined, executionState: ExecutionState | undefined) => {
	const captured = capturedResponseOf(selected);
	const execution = executionState?.status === "idle" ? undefined : executionState;

	if (captured !== undefined && execution !== undefined) {
		return { captured, execution };
	}

	return execution ?? captured;
};

const detailPayloadOf = (
	selected: DebugEntry | undefined,
	tab: DetailTab,
	executionState: ExecutionState | undefined,
) => {
	if (tab === "request") {
		return selected?.graphQL ?? selected?.request;
	}
	if (tab === "javascript") {
		return undefined;
	}
	return responsePayloadOf(selected, executionState);
};

const detailTabLabel: Record<DetailTab, string> = {
	javascript: "JavaScript",
	request: "Request",
	response: "Response",
};

export function DetailPane({
	executionState,
	onExecute,
	onScriptChange,
	onTabChange,
	script,
	selected,
	tab,
}: DetailPaneProps) {
	const canEditScript = Boolean(selected?.graphQL);
	const detailTabs: DetailTab[] = canEditScript ? ["request", "response", "javascript"] : ["request", "response"];
	const activeTab = tab === "javascript" && !canEditScript ? "request" : tab;
	const detailPayload = detailPayloadOf(selected, activeTab, executionState);
	const detailText = detailPayload !== undefined ? (stringify(detailPayload) ?? String(detailPayload)) : undefined;

	return (
		<section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
			<div className="border-[#d9e0ea] border-b bg-white px-4 py-3">
				{selected ? (
					<div className="flex min-w-0 flex-wrap items-center gap-3">
						<div className="min-w-0">
							<div className="flex min-w-0 items-center gap-2">
								<span
									className={`rounded border px-2 py-0.5 font-bold text-[11px] ${methodBadgeClass(
										selected.graphQL?.method ?? "RAW",
									)}`}
								>
									{selected.graphQL?.method ?? "RAW"}
								</span>
								<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold">
									{String(labelOf(selected))}
								</div>
							</div>
							<div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
								{metaOf(selected) || `Entry #${selected.id}`}
							</div>
						</div>
					</div>
				) : (
					<div className="text-[#667386] text-sm">Select an entry to inspect</div>
				)}
			</div>

			<div className="min-h-0 overflow-auto p-4">
				{selected ? (
					<div className="grid gap-4">
						{selected.graphQL ? (
							<div className="grid grid-cols-4 gap-2 max-[760px]:grid-cols-2">
								<div className="rounded border border-[#d9e0ea] bg-white p-3">
									<div className="text-[#667386] text-[11px]">Operation</div>
									<div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
										{selected.graphQL.operationName}
									</div>
								</div>
								<div className="rounded border border-[#d9e0ea] bg-white p-3">
									<div className="text-[#667386] text-[11px]">Query ID</div>
									<div className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs">
										{selected.graphQL.queryId}
									</div>
								</div>
								<div className="rounded border border-[#d9e0ea] bg-white p-3">
									<div className="text-[#667386] text-[11px]">Variables</div>
									<div className="font-semibold text-sm">{countKeys(selected.graphQL.variables)}</div>
								</div>
								<div className="rounded border border-[#d9e0ea] bg-white p-3">
									<div className="text-[#667386] text-[11px]">Features</div>
									<div className="font-semibold text-sm">{countKeys(selected.graphQL.features)}</div>
								</div>
							</div>
						) : null}

						<div className="grid min-h-[320px] grid-rows-[auto_minmax(0,1fr)] gap-2">
							<div className="flex flex-wrap items-center gap-2">
								{detailTabs.map((value) => (
									<button
										className={`h-8 rounded border px-3 text-sm ${
											activeTab === value
												? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
												: "border-[#cfd7e3] bg-white text-[#536173] hover:bg-[#f3f6fa]"
										}`}
										key={value}
										type="button"
										onClick={() => onTabChange(value)}
									>
										{detailTabLabel[value]}
									</button>
								))}
							</div>

							{activeTab === "javascript" && canEditScript ? (
								<ScriptEditor
									executionState={executionState}
									script={script}
									onExecute={onExecute}
									onScriptChange={onScriptChange}
								/>
							) : detailText ? (
								<CodeEditor
									className="min-h-[260px] overflow-hidden rounded border border-[#d9e0ea] bg-white"
									language="json"
									readOnly={true}
									value={detailText}
								/>
							) : (
								<div className="min-h-[260px] rounded border border-[#d9e0ea] bg-white p-4 text-[#667386] text-sm">
									{activeTab === "request" ? "No request captured" : "No response captured yet"}
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="rounded border border-[#d9e0ea] bg-white p-5 text-[#667386] text-sm">
						Waiting for captured requests.
					</div>
				)}
			</div>
		</section>
	);
}
