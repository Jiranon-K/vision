# Vision design system

Colour, components, and state. The live reference is `/design-system` — it renders
every token and every component state in both themes, and it is the page to check
a change against.

Source of truth: [`app/globals.css`](../app/globals.css) for tokens,
[`components/ui/`](../components/ui) for components.

## The three layers

Tokens are layered, and the layer a value lives in determines who may read it.

| Layer         | Example                                       | Who reads it            |
| ------------- | --------------------------------------------- | ----------------------- |
| **Primitive** | `--lime-400`, `--ink-700`                     | Only the semantic layer |
| **Semantic**  | `--surface`, `--foreground`, `--error-strong` | Components              |
| **State**     | `--state-hover`, `--focus-ring-color`         | Components              |

**Components must not read primitives.** Primitives never change between themes, so
a component that reaches past the semantic layer will not respond to dark mode. Note
that the status ramp (`--success`, `--error-strong`, …) is **semantic**, not
primitive — `success` is a meaning, and every step of it flips with the theme.

The one deliberate exception is a decorative fill that is meant to look identical in
both themes, such as `bg-lime-200`. Text paired with such a fill is part of the same
exception and stays a primitive too, because it has to track a fill that does not
move. Lime as ink over a _themed_ surface must go through `--brand-text`.

## Colour

### Primitives

`lime-50` … `lime-950` — the brand accent. `lime-400` (`#b9ff66`) is the canonical
brand value. `lime-900` is the lightest step that clears 4.5:1 on white, so it is the
only lime allowed for text on a light surface — and even then, use `--brand-text`
rather than the primitive, because lime as ink has to flip in dark mode.

`ink-50` … `ink-950` — the neutral ramp, hue-matched to the brand dark.
`ink-950` (`#191a23`) is the brand dark.

### Status

Each of `success`, `warning`, `error`, `info` carries four steps:

| Step      | Use                                                  |
| --------- | ---------------------------------------------------- |
| `-subtle` | Fills — alert backgrounds, subtle badges             |
| (base)    | Marks — icons, borders, solid badge fills            |
| `-strong` | Text. **Always the text step**, and it flips in dark |
| `-on`     | Content sitting on the base fill                     |

`-on` is `ink-950` for all four tones. Every status base is a mid-tone: white text
lands at 2.3:1 on the green and 3.8:1 on the red, so dark content is the only pairing
that passes.

A **destructive control** is not a status fill. `--destructive` points at
`--error-strong` and pairs with `--destructive-foreground`, because a button needs a
fill with enough contrast for its label at 16px — which the base red does not have.
The pairing inverts with the theme: dark red on white text in light mode, light red
on dark text in dark mode.

### Semantic

Surfaces: `background`, `surface`, `surface-muted`, `surface-sunken`, `surface-inverse`.
Text: `foreground`, `text-secondary`, `text-muted`, `text-faint`, `text-inverse`, `text-on-brand`, `brand-text`.
Lines: `border` (quiet hairline), `border-subtle`, `border-strong` (the 2px brutalist outline), `brand-border`.

`text-faint` is the lightest text step that still passes AA. Placeholders count as
body text under WCAG, so there is nothing fainter available.

## State

Interaction is a token, not a per-component guess.

| Token                      | Meaning                                        |
| -------------------------- | ---------------------------------------------- |
| `--state-hover`            | Transparent overlay, composes over any surface |
| `--state-active`           | Pressed overlay                                |
| `--state-selected`         | Lime-tinted selection overlay                  |
| `--state-disabled-opacity` | `0.5`                                          |

**Focus is global.** `*:focus-visible` in `app/globals.css` draws one ring for the
whole app, using `--focus-ring-color` at `--focus-ring-offset`. The offset puts the
ring on the page rather than on the control, which is why the ring tracks the page
background and not the control's fill. Components should not override it.

### Elevation

`shadow-hard-sm` / `shadow-hard` / `shadow-hard-lg` are the brand signature — a flat
offset in `--border-strong`, paired with a `translate` on hover so the surface reads
as pressable. `shadow-soft` and `shadow-panel` are for overlays that must **not** read
as pressable.

### Motion

`--duration-fast` 150ms, `--duration-base` 200ms, `--duration-slow` 300ms,
with `--ease-standard` and `--ease-out`.

`--duration-base` and `--ease-standard` are bound to Tailwind's
`--default-transition-*`, so a bare `transition-all` already runs at the system's
timing. Name a duration only to depart from it. This standardised the buttons, which
previously ran at 300ms while fields ran at 200ms.

## Components

| Component  | Variants                                                                                                    | States                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `Button`   | `default` `secondary` `outline` `ghost` `destructive` `link`; sizes `sm` `default` `lg` `icon`; `fullWidth` | hover, active, focus, `disabled`, `loading`              |
| `Input`    | sizes `sm` `md` `lg`; `leadingIcon` / `trailingIcon`                                                        | default, `error`, `success`, `disabled`, `readOnly`      |
| `Checkbox` | —                                                                                                           | checked, unchecked, `indeterminate`, `disabled`, `error` |
| `Card`     | `default` `elevated` `outline` `interactive`                                                                | hover + press on `interactive`                           |
| `Badge`    | tones × `subtle` `solid` `outline`; sizes `sm` `md`                                                         | —                                                        |
| `Alert`    | tones `neutral` `info` `success` `warning` `error`                                                          | dismissible via `onDismiss`                              |
| `Spinner`  | sizes `sm` `md` `lg`                                                                                        | —                                                        |
| `Label`    | `required`                                                                                                  | —                                                        |

### Field messaging belongs to the field

`Input` and `Checkbox` own their label, hint, error, and success message, and wire
them to the control with `aria-describedby`. Forms should pass `label` / `error`
rather than composing their own markup around a bare input — that is what keeps the
wiring correct everywhere.

Both share one `FieldMessage` (`components/ui/field-message.tsx`), which fixes the
precedence: error, then success, then hint. A field never shows two at once.

### Loading blocks interaction

`<Button loading>` disables the button, sets `aria-busy`, and swaps in a `Spinner`.
Pass `loadingText` to replace the label; omit it to keep the label and add a spinner
beside it.

## Conventions

- **Never hard-code a colour.** No `#191A23`, no `rgba(25,26,35,1)`, no
  `shadow-[4px_4px_0px_0px_#191A23]` — use `shadow-hard`.
- **Never build a class by interpolation.** Tailwind scans source text, so
  `` `bg-lime-${step}` `` generates nothing. Write the full class name.
- **`--brand-*` are legacy aliases** kept because ~640 call sites use them. New code
  should use the semantic names: `bg-primary` over `bg-brand-dark`,
  `text-foreground` over `text-brand-dark`.
- **Radius `sm`–`xl` match Tailwind's own scale** deliberately, so redefining them
  would move every existing `rounded-*` call site. `rounded-pill` is the only addition.

## Verifying a change

```bash
bun run typecheck && bun run lint && bun run build
```

Then open `/design-system`, toggle both themes, and check contrast. Every text and
fill pairing on that page passes WCAG AA in both themes; a change that breaks one
should be caught there before it ships.
