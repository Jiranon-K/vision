# design-sync notes — Vision

Repo-specific gotchas for future syncs. Read this before re-running anything.

## This repo is an app, not a package

Vision is a Next.js app: no `dist/`, no `main`/`module`/`exports`, and
`node_modules/vision` does not exist. Three consequences:

- **`.design-sync/ds-entry.ts` is the bundle entry** (`cfg.entry`) — a barrel
  written purely for the sync. **Adding a component to `components/ui/` means
  adding it to that barrel**, or it never reaches `window.VisionDS`.
- Without `cfg.entry`, the converter dies on
  `ENOENT … node_modules/vision/package.json`. Passing `--entry <any file in the
repo>` also works (it walks up to the repo's `package.json`), but the barrel is
  the correct answer — a single-file entry exports only that file.
- Previews import from the package name (`import { Button } from "vision"`); the
  story-imports shim rewrites that to `window.VisionDS`.

## Stylesheet and fonts come from the Next build

There is no shipped stylesheet, so `.design-sync/prepare-css.mjs` harvests the CSS
Next itself compiles (`.next/static/chunks/*.css`) and splits it in two:

- `.cache/vision-compiled.css` → `cfg.cssEntry`
- `.cache/fonts/fonts.css` + the `.woff2` files → `cfg.extraFonts`

**Run `bun run build` before it** — that is the first half of `cfg.buildCmd`.

## Type declarations are generated, not shipped

The app never emitted `.d.ts`, so every component contract came out as
`[key: string]: unknown` — the design agent got the components but none of their
props. `.design-sync/tsconfig.dts.json` emits real declarations for
`components/ui/` into `dist/types/`, which the converter finds ahead of the
repo's own `types/` directory (it scans `build/ts` → `dist/types` → `types`).

That is the third stage of `cfg.buildCmd`:

```
bun run build && node .design-sync/prepare-css.mjs && bunx tsc -p .design-sync/tsconfig.dts.json
```

`dist/` is gitignored and excluded from ESLint — it is build output, regenerated
every sync.

Two details worth keeping:

- Only `@font-face` rules **with a `url()`** move into `fonts.css`. next/font also
  emits metric-override faces backed by `local(Arial)` (`Space Grotesk Fallback`,
  `Geist Mono Fallback`); those ship no file, and the converter's font copier drops
  them. They must stay in the stylesheet or validate fires `[FONT_MISSING]` for
  families nothing defines.
- The Tailwind CLI was tried first and abandoned: `@source` directives in a CSS
  file that `@import`s the app's `globals.css` are ignored, so it emitted the token
  layer with **zero utilities**. Do not retry that route.

## Capture hazards for overlay and animated components

Both were hit by `ConfirmDialog` and will hit any future Modal / Drawer / Toast /
Popover:

1. **`position: fixed` escapes the card** — it centres on the browser viewport, not
   the captured cell. Wrap the component in a sized `div` with
   `transform: translateZ(0)` (plus `position: relative; overflow: hidden`); the
   transform makes the wrapper the containing block for fixed descendants.
2. **Entry animations capture at their start frame** — `ConfirmDialog` ships the
   panel with `opacity-0` and fades it in with an anime.js tween, so the screenshot
   can land before the tween settles and the panel comes out invisible. The preview
   pins it with a scoped `<style>` overriding `.opacity-0` under a `data-preview`
   attribute.

`ConfirmDialog` is also pinned to `cardMode: "single"` at `640x420` in the config.

## Preview conventions that worked

- `className` for anything design-system (colour, radius, shadow); inline
  `style={{}}` only for preview layout (gap, max-width). Wrap single fields in a
  `max-width` container or they stretch across the ~900px sheet.
- Icons are sized **only** by their `className` (`size-4`/`size-6`/`size-10`) and
  coloured by `currentColor`. With no size class they collapse to nothing — that is
  why every icon preview sets one, and why the unauthored floor cards were blank.
- The five Card slots (`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/
  `CardFooter`) are unstyled boxes on their own, so each preview deliberately
  renders the whole Card composition. A copy edit must be applied to all five files
  or the sheets disagree.
- Use the CONTEXT.md vocabulary in preview copy — Post, Draft, Published, Slug,
  Excerpt, Creator, Reader, View, Audience, Plan. A first pass drifted into
  "channels" and "user"; it was caught at grading, not before.

## Fixed in source during the first sync

`LogoIcon` hardcoded `fill="#b9ff66"` while every other icon uses `currentColor`,
so it painted lime-on-lime and vanished on brand surfaces. Changed to
`fill="currentColor"`, with `className="text-brand-lime"` added at its only call
site (`components/dashboard/Sidebar.tsx`) to preserve the existing appearance.

## Known render warns

None. The final validate run was clean — 30/30 previews render, no warnings.

## Re-sync risks

- **The barrel goes stale silently.** A component added to `components/ui/` but not
  to `.design-sync/ds-entry.ts` simply never appears; nothing errors. Diff the
  barrel against `components/ui/` on every sync.
- **`cfg.cssEntry` and `cfg.extraFonts` point into `.cache/`, which is gitignored.**
  On a fresh clone they do not exist until `cfg.buildCmd` runs. Always run it.
- **next/font filenames are content-hashed.** Every `bun run build` can rename the
  `.woff2` files, so the bundle's `fonts/` churns and `upload.any` goes true even
  when nothing visible changed. Expected, not a defect.
- **`prepare-css.mjs` parses Next's build output with regexes.** A Next major
  upgrade that changes the CSS emit (or moves fonts out of `static/media`) breaks
  it — the symptom is `[FONT_MISSING]` or a stylesheet missing utilities.
- **Assumed toolchain for this run:** Node 24.18, Next 16.1.6, Tailwind 4,
  playwright-core pinning chromium-1234 (already cached — no download was needed).
- **The `.design-sync/.cache/review/*.grade.json` verdicts are gitignored**
  working state. Carry-forward across machines comes from the uploaded
  `_ds_sync.json`, not from git.
