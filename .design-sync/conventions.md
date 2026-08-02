# Building with Vision

Vision is a publishing platform for content creators. The look is neo-brutalist:
flat surfaces, 2px black outlines, hard offset shadows, one loud lime accent
against near-black ink.

## Setup

**No provider or wrapper is required.** Import a component and render it —
`window.VisionDS` exports are plain React components with no context dependency.

Dark mode is a **class, not a prop**: put `dark` on any ancestor and every
semantic token below flips inside it. Nothing else changes.

```jsx
<div className="dark bg-background text-foreground">
  <Button>Publish Post</Button>
</div>
```

## Styling: Tailwind utilities over semantic tokens

This is a Tailwind v4 system. Style with utility classes, and **use the semantic
names below rather than raw colours** — `bg-primary`, never `bg-[#191a23]`. The
raw `lime-*` / `ink-*` ramps exist but do not respond to the theme; reach for
them only for a decorative fill that should look identical in both themes.

Every class listed here ships in the stylesheet whether or not the app currently
uses it, so all of them are safe in new markup.

| Family    | Names                                                                                                                                                                             | Use                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Surfaces  | `bg-background` `bg-surface` `bg-surface-muted` `bg-surface-sunken` `bg-surface-inverse`                                                                                          | page, panels, wells                                                              |
| Text      | `text-foreground` `text-text-secondary` `text-text-muted` `text-text-faint` `text-text-inverse` `text-text-on-brand` `text-brand-text`                                            | `foreground` for body, `text-muted` for secondary, `text-faint` for placeholders |
| Lines     | `border-border` `border-border-subtle` `border-border-strong` `border-brand-border`                                                                                               | `border-strong` is the 2px brutalist outline; `border` is the quiet hairline     |
| Roles     | `bg-primary` `text-primary-foreground` `bg-primary-hover` `bg-secondary` `bg-accent` `text-accent-foreground` `bg-muted` `bg-card` `bg-destructive` `text-destructive-foreground` | `accent` is the lime in both themes; `secondary` is grey in dark                 |
| Status    | `bg-{success,warning,error,info}` and each with `-subtle` (fills), `-strong` (text), `-on` (content on the base)                                                                  | `-strong` is always the text step                                                |
| Brand     | `bg-brand-lime` `bg-brand-dark` `bg-brand-gray` `text-brand-text`                                                                                                                 | legacy aliases, still fully supported                                            |
| State     | `hover:bg-state-hover` `active:bg-state-active` `bg-state-selected`                                                                                                               | transparent overlays that compose over any surface                               |
| Elevation | `shadow-hard-sm` `shadow-hard` `shadow-hard-lg` `shadow-soft` `shadow-panel`                                                                                                      | the hard shadows are the brand signature                                         |
| Radius    | `rounded-md` `rounded-lg` `rounded-xl` `rounded-2xl` `rounded-pill`                                                                                                               | `xl` on controls, `2xl` on cards                                                 |

**The house move:** a pressable surface pairs `border-2 border-border-strong` +
`shadow-hard` with a press displacement — `hover:shadow-none hover:translate-x-1
hover:translate-y-1`. That is what `Button` and `Card variant="interactive"` do,
and what your own pressable surfaces should do.

**Focus is global.** One `*:focus-visible` outline is defined for the whole
system. Never add your own focus ring.

**Motion is bound to the defaults.** A bare `transition-all` already runs at the
system's 200ms and easing. Only name a duration to depart from it.

## Composition rules that matter

- **Fields own their messaging.** Pass `label`, `hint`, `error`, `success` to
  `Input` and `Checkbox` — they render the label, wire `aria-describedby`, and
  apply the error/success border. Do not hand-build a label + input + error
  paragraph; the wiring is the point.
- **Loading is a prop.** `<Button loading>` disables the button, sets
  `aria-busy`, and swaps in a `Spinner`. Add `loadingText` to replace the label.
- **Card is a slot set.** `Card` > `CardHeader` (`CardTitle`, `CardDescription`)
  > `CardContent` > `CardFooter`. The slots carry the padding; do not re-pad.
- **Icons take only `className`.** They are sized by it (`size-4`, `size-5`,
  `size-6`) and coloured by `currentColor`. Without a size class they render at
  zero.

## Where the truth is

- `_ds/<folder>/styles.css` and its `@import` closure — every token's real value.
- `_ds/<folder>/guidelines/docs/design-system.md` — the full token architecture,
  including which layer may read which.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component API and examples.

## A representative build

```jsx
<Card variant="elevated" className="max-w-md">
  <CardHeader>
    <div className="flex items-center gap-2">
      <CardTitle>Growth Analytics</CardTitle>
      <Badge tone="success">Published</Badge>
    </div>
    <CardDescription>Views and Audience growth, last 7 days</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-text-secondary">
      3,410 Views from 1,284 Readers — up 18% on the previous period.
    </p>
  </CardContent>
  <CardFooter className="gap-3">
    <Button size="sm">Open report</Button>
    <Button size="sm" variant="ghost">
      Dismiss
    </Button>
  </CardFooter>
</Card>
```

## Vocabulary

Use the product's own words in copy: **Post**, **Draft**, **Published**,
**Slug**, **Excerpt**, **Category**, **Featured**, **Creator**, **Reader**,
**View**, **Audience**, **Plan**, **Subscriber**. Never "live" for Published,
"user" for Creator, or "article" for Post.
