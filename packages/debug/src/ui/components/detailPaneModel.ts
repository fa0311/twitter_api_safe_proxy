import type { DebugEntry } from "../entryUtils";

export type DetailTab = "request" | "response" | "javascript";

const detailTabLabel: Record<DetailTab, string> = {
	javascript: "JavaScript",
	request: "Request",
	response: "Response",
};

export const detailTabs: DetailTab[] = ["request", "response", "javascript"];

export const labelOf = (tab: DetailTab) => detailTabLabel[tab];

export const detailPayloadOf = (selected: DebugEntry, tab: DetailTab): unknown => {
	if (tab === "request") return selected.request;
	if (tab === "response") return selected.response;
	return undefined;
};
