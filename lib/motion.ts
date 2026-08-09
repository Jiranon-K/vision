import { cubicBezier } from "animejs";

// The motion tokens in app/globals.css, mirrored once for JavaScript.
//
// animejs animates DOM properties directly and cannot read CSS custom
// properties, so anything it drives needs the token's *value*. Every
// component that reached for one used to hand-copy it with its own comment
// explaining why — five copies of the same number, each free to drift from
// app/globals.css on its own. This is the one place that has to be kept in
// step with the `--duration-*` / `--ease-*` block there.
//
// Only for animejs. Anything a CSS transition can do should keep using the
// token itself (`duration-[var(--duration-base)]`) and never these.

export const DURATION_FAST = 150;
export const DURATION_BASE = 200;
export const DURATION_SLOW = 300;

export const EASE_STANDARD = cubicBezier(0.4, 0, 0.2, 1);
export const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);

// Not a token: how long a Draft -> Published save holds on the editor while
// the top bar plays its crossfade and accent wash, before leaving for the
// posts list. Deliberately the slowest thing on that screen (ticket 04).
// It lives here because two files have to agree on it — PostEditorForm owns
// the timer, EditorTopBar animates the wash that has to end with it.
export const PUBLISH_TRANSITION_MS = 900;
