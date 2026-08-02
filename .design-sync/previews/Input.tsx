import { EyeIcon, HomeIcon, Input } from "vision";

export const WithLabelAndHint = () => (
  <div style={{ maxWidth: 380 }}>
    <Input
      label="Email"
      required
      type="email"
      placeholder="creator@vision.app"
      hint="We'll never share this."
      leadingIcon={<HomeIcon className="size-5" />}
    />
  </div>
);

export const Validation = () => (
  <div style={{ display: "grid", gap: 20, maxWidth: 380 }}>
    <Input label="Slug" defaultValue="my first post" error="Slug must be URL-safe." />
    <Input label="Slug" defaultValue="my-first-post" success="Available." />
  </div>
);

export const States = () => (
  <div style={{ display: "grid", gap: 20, maxWidth: 380 }}>
    <Input label="Disabled" placeholder="Unavailable" disabled />
    <Input label="Read only" defaultValue="creator@vision.app" readOnly />
    <Input
      label="Password"
      type="password"
      defaultValue="correct-horse"
      trailingIcon={<EyeIcon className="size-5" />}
    />
  </div>
);

export const Sizes = () => (
  <div style={{ display: "grid", gap: 20, maxWidth: 380 }}>
    <Input label="Small" inputSize="sm" placeholder="Excerpt" />
    <Input label="Medium" inputSize="md" placeholder="Excerpt" />
    <Input label="Large" inputSize="lg" placeholder="Excerpt" />
  </div>
);
