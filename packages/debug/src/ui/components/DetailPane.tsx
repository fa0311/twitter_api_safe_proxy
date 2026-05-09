import { countKeys, labelOf, metaOf, methodBadgeClass, stringify } from "../entryUtils";
import type { DebugEntry, DetailTab, ReplayState } from "../types";

type DetailPaneProps = {
	onReplay: () => void;
	onTabChange: (tab: DetailTab) => void;
	replayState?: ReplayState;
	selected?: DebugEntry;
	tab: DetailTab;
};

const detailPayloadOf = (selected: DebugEntry | undefined, tab: DetailTab, replayState: ReplayState | undefined) => {
	if (tab === "request") {
		return selected?.graphQL ?? selected?.raw;
	}
	if (tab === "raw") {
		return selected?.raw;
	}
	return replayState;
};

export function DetailPane({ onReplay, onTabChange, replayState, selected, tab }: DetailPaneProps) {
	const detailPayload = detailPayloadOf(selected, tab, replayState);

	return (
		<section className="grid min-h-0 grid-rows-[auto_1fr]">
			<div className="border-[#d9e0ea] border-b bg-white px-4 py-3">
				{selected ? (
					<div className="flex flex-wrap items-center gap-3">
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
						<button
							className="ml-auto h-9 rounded bg-[#14532d] px-4 font-semibold text-sm text-white hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-[#aab4c1]"
							disabled={!selected.graphQL || replayState?.status === "loading"}
							type="button"
							onClick={onReplay}
						>
							{replayState?.status === "loading" ? "Replaying" : "Replay"}
						</button>
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

						<div className="flex flex-wrap items-center gap-2">
							{(["request", "raw", "response"] as const).map((value) => (
								<button
									className={`h-8 rounded border px-3 text-sm ${
										tab === value
											? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
											: "border-[#cfd7e3] bg-white text-[#536173] hover:bg-[#f3f6fa]"
									}`}
									key={value}
									type="button"
									onClick={() => onTabChange(value)}
								>
									{value === "request" ? "Request" : value === "raw" ? "Raw" : "Response"}
								</button>
							))}
						</div>

						<pre className="m-0 min-h-[360px] overflow-auto rounded border border-[#d9e0ea] bg-white p-4 font-mono text-xs leading-relaxed text-[#17202c]">
							{detailPayload ? stringify(detailPayload) : "No replay response yet"}
						</pre>
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
