import { FieldMessage } from "vision";

export const Precedence = () => (
  <div style={{ display: "grid", gap: 18, maxWidth: 420 }}>
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>hint</p>
      <FieldMessage id="fm-hint" hint="Slugs are lowercase and hyphenated." />
    </div>
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>success</p>
      <FieldMessage id="fm-success" hint="ignored" success="Available." />
    </div>
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.6 }}>error</p>
      <FieldMessage
        id="fm-error"
        hint="ignored"
        success="ignored"
        error="Slug must be URL-safe."
      />
    </div>
  </div>
);
