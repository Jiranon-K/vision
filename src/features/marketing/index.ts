// The marketing feature's interface (ADR 0007): the public pages' sections and
// their copy. The featured-Posts section fetches during a server render, so it
// is exported from server.ts instead.
export { default as CtaBlock } from "./components/home/cta-block";
export { default as HomeHeader } from "./components/home/header";
export { default as HomeServices } from "./components/home/services";
export { default as PricingHero } from "./components/pricing/hero";
export { default as ServicesHero } from "./components/services/hero";
export { default as Process } from "./components/services/process";
export { default as Specialization } from "./components/services/specialization";
