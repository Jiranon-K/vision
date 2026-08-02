import { DashboardIcon } from "vision";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <DashboardIcon className="size-4" />
    <DashboardIcon className="size-6" />
    <DashboardIcon className="size-10" />
  </div>
);

export const OnSurfaces = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span className="text-foreground">
      <DashboardIcon className="size-6" />
    </span>
    <span
      className="bg-primary text-primary-foreground rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <DashboardIcon className="size-6" />
    </span>
    <span
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <DashboardIcon className="size-6" />
    </span>
  </div>
);
