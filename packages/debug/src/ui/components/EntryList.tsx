import { countKeys, formatTime, labelOf, metaOf, methodBadgeClass } from "../entryUtils";
import type { DebugEntry } from "../types";

type EntryListProps = {
	entries: DebugEntry[];
	onSelect: (id: number) => void;
	selectedId?: number;
};

export function EntryList({ entries, onSelect, selectedId }: EntryListProps) {
	return (
		<div className="min-h-0 overflow-y-auto overscroll-contain">
			{entries.length === 0 ? (
				<div className="p-5 text-[#667386] text-sm">No matching entries</div>
			) : (
				entries.map((entry) => {
					const method = entry.graphQL?.method ?? "RAW";
					const selectedEntry = entry.id === selectedId;
					return (
						<button
							className={`grid w-full cursor-pointer gap-2 border-0 border-[#edf0f4] border-b bg-transparent px-3.5 py-3 text-left hover:bg-[#f4f8ff] ${
								selectedEntry ? "bg-[#edf5ff]" : ""
							}`}
							key={entry.id}
							type="button"
							onClick={() => onSelect(entry.id)}
						>
							<span className="flex min-w-0 items-center gap-2">
								<span className={`rounded border px-2 py-0.5 font-bold text-[11px] ${methodBadgeClass(method)}`}>
									{method}
								</span>
								<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
									{String(labelOf(entry))}
								</span>
								<span className="ml-auto whitespace-nowrap font-mono text-[#667386] text-[11px]">#{entry.id}</span>
							</span>
							<span className="overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
								{metaOf(entry) || "No metadata"}
							</span>
							<span className="flex flex-wrap items-center gap-2 text-[#7a8697] text-[11px]">
								<span>{formatTime(entry.receivedAt)}</span>
								{entry.graphQL ? (
									<>
										<span>variables {countKeys(entry.graphQL.variables)}</span>
										<span>features {countKeys(entry.graphQL.features)}</span>
									</>
								) : (
									<span>not replayable</span>
								)}
							</span>
						</button>
					);
				})
			)}
		</div>
	);
}
