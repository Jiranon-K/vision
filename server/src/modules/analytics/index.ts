// The Analytics module's interface (ADR 0007). Anything not exported here, or
// from analytics.routes.ts for mounting, is internal to the module.
export { recordView, forgetViews, type ViewSource } from './record-view';
