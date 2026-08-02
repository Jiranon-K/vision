import { Badge } from "vision";

const TONES = ["neutral", "brand", "success", "warning", "error", "info"] as const;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <span
      style={{ width: 72, fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}
    >
      {label}
    </span>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
  </div>
);

export const Appearances = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <Row label="subtle">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </Row>
    <Row label="solid">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone} appearance="solid">
          {tone}
        </Badge>
      ))}
    </Row>
    <Row label="outline">
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone} appearance="outline">
          {tone}
        </Badge>
      ))}
    </Row>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <Badge tone="brand" size="sm">
      Featured
    </Badge>
    <Badge tone="brand" size="md">
      Featured
    </Badge>
  </div>
);

export const InContext = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
    <Badge tone="success" appearance="solid">
      Published
    </Badge>
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="brand" appearance="outline">
      Featured
    </Badge>
    <Badge tone="info">Marketing</Badge>
    <Badge tone="warning">Scheduled</Badge>
  </div>
);
