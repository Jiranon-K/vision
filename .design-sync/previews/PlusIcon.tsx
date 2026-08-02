import { PlusIcon } from "vision";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
    <PlusIcon className="size-4" />
    <PlusIcon className="size-6" />
    <PlusIcon className="size-10" />
  </div>
);

export const OnSurfaces = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span className="text-foreground">
      <PlusIcon className="size-6" />
    </span>
    <span
      className="bg-primary text-primary-foreground rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <PlusIcon className="size-6" />
    </span>
    <span
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "inline-flex", padding: 10 }}
    >
      <PlusIcon className="size-6" />
    </span>
  </div>
);
