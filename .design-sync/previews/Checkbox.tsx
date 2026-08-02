import { Checkbox } from "vision";

export const States = () => (
  <div style={{ display: "grid", gap: 18, maxWidth: 420 }}>
    <Checkbox label="Email me when a Post is Published" defaultChecked />
    <Checkbox label="Include this Post in the weekly Reader digest" />
    <Checkbox label="Notify my Audience about new Drafts" indeterminate />
    <Checkbox label="Schedule Published Posts by timezone" disabled />
  </div>
);

export const WithMessages = () => (
  <div style={{ display: "grid", gap: 18, maxWidth: 420 }}>
    <Checkbox
      label="Feature this Post"
      hint="Featured Posts get prominent placement on the blog."
      defaultChecked
    />
    <Checkbox label="I accept the terms" error="You must accept the terms to continue." />
  </div>
);

export const Group = () => (
  <fieldset style={{ display: "grid", gap: 14, maxWidth: 420, border: 0, padding: 0 }}>
    <legend style={{ fontWeight: 700, marginBottom: 6 }}>Broadcast channels</legend>
    <Checkbox label="X / Twitter" defaultChecked />
    <Checkbox label="LinkedIn" defaultChecked />
    <Checkbox label="Threads" />
    <Checkbox label="Mastodon" disabled hint="Connect the channel first." />
  </fieldset>
);
