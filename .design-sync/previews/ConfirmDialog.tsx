import { ConfirmDialog } from "vision";

/* Two things need handling to capture this component statically:
   1. It is a `position: fixed` overlay, so it centres on the browser viewport
      and lands outside the captured card. A `transform` on the wrapper makes it
      the containing block for fixed descendants, pulling it back into the cell.
   2. The panel ships with `opacity-0` and is faded in by an anime.js tween, so
      a screenshot can land before the tween settles. The override pins it to
      its settled state. */
export const Danger = () => (
  <div
    data-preview="confirm-dialog"
    style={{
      position: "relative",
      transform: "translateZ(0)",
      width: "100%",
      height: 340,
      overflow: "hidden",
    }}
  >
    <style>{`[data-preview="confirm-dialog"] .opacity-0 { opacity: 1 !important; }`}</style>
    <ConfirmDialog
      open
      danger
      title="Delete this Post?"
      message="This permanently removes the Post and its View history. This cannot be undone."
      confirmText="Delete Post"
      cancelText="Keep it"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  </div>
);
