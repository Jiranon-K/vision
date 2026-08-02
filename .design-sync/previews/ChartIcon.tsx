import { ChartIcon } from "vision";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <ChartIcon className="size-4" />
    <ChartIcon className="size-6" />
    <ChartIcon className="size-10" />
  </div>
);

export const OnSurfaces = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span className="text-foreground">
      <ChartIcon className="size-6" />
    </span>
    <span
      className="bg-primary text-primary-foreground rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <ChartIcon className="size-6" />
    </span>
    <span
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <ChartIcon className="size-6" />
    </span>
  </div>
);
