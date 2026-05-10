import type { DebugEntry } from "../entryUtils";
import { MethodBadge } from "./MethodBadge";

export const DetailHeader = ({ entry }: { entry: DebugEntry }) => {
	return (
		<div className="border-[#d9e0ea] border-b bg-white px-4 py-3">
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<MethodBadge method={entry.method} />
						<span className="rounded border border-[#d7dce4] bg-[#f3f5f8] px-1.5 py-0.5 font-bold text-[#536173] text-[11px]">
							{entry.version}
						</span>
						<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-bold">{entry.label}</div>
					</div>
					<div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[#667386] text-xs">
						{entry.path}
					</div>
				</div>
			</div>
		</div>
	);
};
