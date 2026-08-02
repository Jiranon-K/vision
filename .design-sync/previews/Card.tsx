import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "vision";

export const Variants = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 20,
    }}
  >
    {(["default", "elevated", "outline", "interactive"] as const).map((variant) => (
      <Card key={variant} variant={variant}>
        <CardHeader>
          <CardTitle className="text-xl">{variant}</CardTitle>
          <CardDescription>Card variant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">Views this week: 1,284</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const FullComposition = () => (
  <div style={{ maxWidth: 420 }}>
    <Card variant="elevated">
      <CardHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CardTitle>Multi-Channel Sync</CardTitle>
          <Badge tone="success">Published</Badge>
        </div>
        <CardDescription>
          Broadcast one Post to every connected channel from a single publish.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">
          Your last Post reached 3,410 Readers across 4 channels — up 18% on the
          previous one.
        </p>
      </CardContent>
      <CardFooter style={{ gap: 12 }}>
        <Button size="sm">Open report</Button>
        <Button size="sm" variant="ghost">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export const Interactive = () => (
  <div style={{ maxWidth: 320 }}>
    <Card variant="interactive" role="button" tabIndex={0}>
      <CardHeader>
        <CardTitle className="text-xl">Draft: Growth loops</CardTitle>
        <CardDescription>Edited 2 hours ago</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted">
          Press me — interactive pairs the hard shadow with a press displacement.
        </p>
      </CardContent>
    </Card>
  </div>
);
