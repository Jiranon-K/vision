import { Alert } from "vision";

export const Tones = () => (
  <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
    <Alert tone="info" title="Draft saved">
      Your Post is saved but not yet visible to Readers.
    </Alert>
    <Alert tone="success" title="Published">
      Your Post is Published at /blog/my-first-post — Readers can see it now.
    </Alert>
    <Alert tone="warning" title="Plan limit approaching">
      You have used 9 of 10 Multi-Channel Sync broadcasts this month.
    </Alert>
    <Alert tone="error" title="Publish failed">
      The slug is already taken by another Post.
    </Alert>
  </div>
);

export const Dismissible = () => (
  <div style={{ maxWidth: 560 }}>
    <Alert tone="warning" title="Unsaved changes" onDismiss={() => {}}>
      Leaving now discards everything written since the last save.
    </Alert>
  </div>
);

export const TitleOnly = () => (
  <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
    <Alert tone="success" title="Slug is available." />
    <Alert tone="info">Analytics refresh every 15 minutes.</Alert>
  </div>
);
