import { Button } from "vision";

export const Variants = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    <Button size="sm">Publish Post</Button>
    <Button size="sm" variant="secondary">
      Save Draft
    </Button>
    <Button size="sm" variant="outline">
      Preview
    </Button>
    <Button size="sm" variant="ghost">
      Cancel
    </Button>
    <Button size="sm" variant="destructive">
      Delete Post
    </Button>
    <Button size="sm" variant="link">
      View on blog
    </Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="New Post">
      +
    </Button>
  </div>
);

export const States = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    <Button size="sm">Rest</Button>
    <Button size="sm" disabled>
      Disabled
    </Button>
    <Button size="sm" loading>
      Loading
    </Button>
    <Button size="sm" loading loadingText="Publishing…">
      Publish
    </Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 360 }}>
    <Button fullWidth>Start writing</Button>
  </div>
);
