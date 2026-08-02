import { Spinner } from "vision";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </div>
);

export const OnBrand = () => (
  <div style={{ display: "flex", gap: 16 }}>
    <div
      className="bg-primary text-primary-foreground rounded-xl"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px" }}
    >
      <Spinner size="sm" label={null} />
      <span style={{ fontWeight: 600 }}>Publishing…</span>
    </div>
    <div
      className="bg-brand-lime text-text-on-brand rounded-xl"
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px" }}
    >
      <Spinner size="sm" label={null} />
      <span style={{ fontWeight: 600 }}>Saving draft…</span>
    </div>
  </div>
);
