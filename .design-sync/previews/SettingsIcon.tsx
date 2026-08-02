import { SettingsIcon } from "vision";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <SettingsIcon className="size-4" />
    <SettingsIcon className="size-6" />
    <SettingsIcon className="size-10" />
  </div>
);

export const OnSurfaces = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span className="text-foreground">
      <SettingsIcon className="size-6" />
    </span>
    <span
      className="bg-primary text-primary-foreground rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <SettingsIcon className="size-6" />
    </span>
    <span
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <SettingsIcon className="size-6" />
    </span>
  </div>
);
