import { useState } from "react";
import { defaultScriptOf, stringify } from "../entryUtils";
import { useDebugEntriesStore, useEntrySelectionStore } from "../store";
import type { DebugEntry, DetailTab } from "../types";
import { CodeEditor } from "./CodeEditor";
import { MethodBadge } from "./MethodBadge";
import { ScriptEditor } from "./ScriptEditor";

const detailTabLabel: Record<DetailTab, string> = {
	javascript: "JavaScript",
	request: "Request",
	response: "Response",
};

const detailPayloadOf = (selected: DebugEntry, tab: DetailTab): unknown => {
	if (tab === "request") return selected.request;
	if (tab === "javascript") return undefined;
	return selected.response;
};

const allTabs: DetailTab[] = ["request", "response", "javascript"];

export const DetailPane = () => {
	const selectedEntryId = useEntrySelectionStore((s) => s.selectedEntryId);
	const entries = useDebugEntriesStore((s) => s.entries);
	const [tab, setTab] = useState<DetailTab>("request");
	const [scripts, setScripts] = useState<Record<number, string>>({});

	const selected = entries.find((e) => e.id === selectedEntryId);
	const hasEntries = entries.length > 0;

	if (!selected) {
		const message = hasEntries ? "Select an entry from the list." : "Waiting for captured requests.";
		return (
			<section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
				<div className="border-[#d9e0ea] border-b bg-white px-4 py-3">
					<div className="text-[#667386] text-sm">{message}</div>
				</div>
			</section>
		);
	}

	const detailPayload = detailPayloadOf(selected, tab);
	const detailText = detailPayload === undefined ? undefined : stringify(detailPayload);

	const script = scripts[selected.id] ?? defaultScriptOf(selected);
	const onScriptChange = (next: string) => setScripts((prev) => ({ ...prev, [selected.id]: next }));

	return (
		<section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
			<div className="border-[#d9e0ea] border-b bg-white px-4 py-3">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<div className="min-w-0">
						<div className="flex min-w-0 items-center gap-2">
							<MethodBadge method={selected.method} />
							<span className="rounded border border-[#d7dce4] bg-[#f3f5f8] px-1.5 py-0.5 font-bold text-[#536173] text-[11px]">
								{selected.version}
							</span>
							<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold">{selected.label}</div>
						</div>
						<div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
							{selected.path}
						</div>
					</div>
				</div>
			</div>

			<div className="min-h-0 overflow-auto p-4">
				<div className="grid min-h-[320px] grid-rows-[auto_minmax(0,1fr)] gap-2">
					<div className="flex flex-wrap items-center gap-2">
						{allTabs.map((value) => (
							<button
								className={`h-8 rounded border px-3 text-sm ${
									tab === value
										? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
										: "border-[#cfd7e3] bg-white text-[#536173] hover:bg-[#f3f6fa]"
								}`}
								key={value}
								type="button"
								onClick={() => setTab(value)}
							>
								{detailTabLabel[value]}
							</button>
						))}
					</div>

					{tab === "javascript" ? (
						<ScriptEditor entry={selected} key={selected.id} script={script} onScriptChange={onScriptChange} />
					) : detailText ? (
						<CodeEditor
							className="min-h-[260px] overflow-hidden rounded border border-[#d9e0ea] bg-white"
							language="json"
							readOnly={true}
							value={detailText}
						/>
					) : (
						<div className="min-h-[260px] rounded border border-[#d9e0ea] bg-white p-4 text-[#667386] text-sm">
							No response captured yet
						</div>
					)}
				</div>
			</div>
		</section>
	);
};
