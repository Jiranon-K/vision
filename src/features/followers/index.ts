// The Followers feature's interface (ADR 0007, ADR 0009): a Reader follows a
// Creator by email; the Creator delivers Posts to them and owns the list.
// Anything not exported here is internal to the feature.
export { default as FollowCard } from "./components/follow-card";
export { default as FollowLinkPage } from "./components/follow-link-page";
export { default as DeliverSection, type DeliverSectionProps } from "./components/deliver-section";
export { default as FollowersScreen } from "./components/followers-screen";
export { default as FollowersBand } from "./components/followers-band";
export { default as DeliveredBadge } from "./components/delivered-badge";
export { useFollowerSummary } from "./hooks/use-followers";
export type { FollowerFigures, FollowerRow, FollowerSummary, FollowOutcome } from "./types";
