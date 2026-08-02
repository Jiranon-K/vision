import { Input, Label } from "vision";

export const Basic = () => (
  <div style={{ display: "grid", gap: 14 }}>
    <Label>Excerpt</Label>
    <Label required>Email address</Label>
  </div>
);

export const OnAField = () => (
  <div style={{ maxWidth: 380 }}>
    <Label htmlFor="label-demo-slug" required className="mb-1.5">
      Slug
    </Label>
    <Input id="label-demo-slug" defaultValue="my-first-post" />
  </div>
);
