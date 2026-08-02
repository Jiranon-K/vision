import { LogoIcon } from "vision";

export const Sizes = () => (
  <div
    className="text-brand-lime"
    style={{ display: "flex", alignItems: "center", gap: 20 }}
  >
    <LogoIcon className="size-4" />
    <LogoIcon className="size-6" />
    <LogoIcon className="size-10" />
  </div>
);

export const OnSurfaces = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span className="text-foreground">
      <LogoIcon className="size-6" />
    </span>
    <span
      className="bg-primary text-brand-lime rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <LogoIcon className="size-6" />
    </span>
    <span
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <LogoIcon className="size-6" />
    </span>
  </div>
);
