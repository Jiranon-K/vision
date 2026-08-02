"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { EyeIcon, HomeIcon } from "@/components/ui/Icons";

/* Written out in full: Tailwind scans source text, so a class built
   by interpolation is never generated. */
const LIME_RAMP = [
  { name: "lime-50", className: "bg-lime-50" },
  { name: "lime-100", className: "bg-lime-100" },
  { name: "lime-200", className: "bg-lime-200" },
  { name: "lime-300", className: "bg-lime-300" },
  { name: "lime-400", className: "bg-lime-400" },
  { name: "lime-500", className: "bg-lime-500" },
  { name: "lime-600", className: "bg-lime-600" },
  { name: "lime-700", className: "bg-lime-700" },
  { name: "lime-800", className: "bg-lime-800" },
  { name: "lime-900", className: "bg-lime-900" },
  { name: "lime-950", className: "bg-lime-950" },
];

const INK_RAMP = [
  { name: "ink-50", className: "bg-ink-50" },
  { name: "ink-100", className: "bg-ink-100" },
  { name: "ink-200", className: "bg-ink-200" },
  { name: "ink-300", className: "bg-ink-300" },
  { name: "ink-400", className: "bg-ink-400" },
  { name: "ink-500", className: "bg-ink-500" },
  { name: "ink-600", className: "bg-ink-600" },
  { name: "ink-700", className: "bg-ink-700" },
  { name: "ink-800", className: "bg-ink-800" },
  { name: "ink-900", className: "bg-ink-900" },
  { name: "ink-950", className: "bg-ink-950" },
];

const SEMANTIC_SWATCHES = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-muted", className: "bg-surface-muted" },
  { name: "surface-sunken", className: "bg-surface-sunken" },
  { name: "surface-inverse", className: "bg-surface-inverse" },
  { name: "border", className: "bg-border" },
  { name: "border-subtle", className: "bg-border-subtle" },
  { name: "border-strong", className: "bg-border-strong" },
];

const TEXT_TOKENS = [
  { name: "foreground", className: "text-foreground" },
  { name: "text-secondary", className: "text-text-secondary" },
  { name: "text-muted", className: "text-text-muted" },
  { name: "text-faint", className: "text-text-faint" },
];

const STATUS_RAMPS = [
  {
    tone: "success",
    steps: [
      { name: "success-subtle", className: "bg-success-subtle" },
      { name: "success", className: "bg-success" },
      { name: "success-strong", className: "bg-success-strong" },
    ],
  },
  {
    tone: "warning",
    steps: [
      { name: "warning-subtle", className: "bg-warning-subtle" },
      { name: "warning", className: "bg-warning" },
      { name: "warning-strong", className: "bg-warning-strong" },
    ],
  },
  {
    tone: "error",
    steps: [
      { name: "error-subtle", className: "bg-error-subtle" },
      { name: "error", className: "bg-error" },
      { name: "error-strong", className: "bg-error-strong" },
    ],
  },
  {
    tone: "info",
    steps: [
      { name: "info-subtle", className: "bg-info-subtle" },
      { name: "info", className: "bg-info" },
      { name: "info-strong", className: "bg-info-strong" },
    ],
  },
];

const BADGE_TONES = [
  "neutral",
  "brand",
  "success",
  "warning",
  "error",
  "info",
] as const;

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t-2 border-border-strong pt-8">
      <h2 className="text-3xl font-black text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-text-muted">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-3">
      <span className="w-28 shrink-0 font-mono text-xs uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({
  className,
  name,
  code,
}: {
  className: string;
  name: string;
  code?: string;
}) {
  return (
    <div className="w-24">
      <div
        className={`h-14 rounded-lg border-2 border-border-strong ${className}`}
      />
      <p className="mt-1 font-mono text-[11px] leading-tight text-foreground">
        {name}
      </p>
      {code ? (
        <p className="font-mono text-[11px] text-text-muted">{code}</p>
      ) : null}
    </div>
  );
}

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);
  const [checked, setChecked] = useState(true);

  return (
    <div className={dark ? "dark bg-background" : "bg-background"}>
      <div className="min-h-screen bg-background px-6 py-12 text-foreground md:px-12">
        <div className="mx-auto max-w-6xl space-y-12">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-tight">
                Vision Design System
              </h1>
              <p className="mt-2 max-w-2xl text-text-muted">
                Colour, components, and state. Every value below is a token from{" "}
                <code className="font-mono text-sm">app/globals.css</code> —
                components never hard-code a colour.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? "Light theme" : "Dark theme"}
            </Button>
          </header>

          <Section
            title="Colour — primitives"
            description="The raw ramps. Components must not reference these directly; they exist so the semantic layer has somewhere to point."
          >
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
              lime — 400 is the brand value, 900 is the lightest step readable as
              text on white
            </p>
            <div className="flex flex-wrap gap-3">
              {LIME_RAMP.map((s) => (
                <Swatch key={s.name} name={s.name} className={s.className} />
              ))}
            </div>

            <p className="mt-8 mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
              ink — the neutral ramp, hue-matched to the brand dark
            </p>
            <div className="flex flex-wrap gap-3">
              {INK_RAMP.map((s) => (
                <Swatch key={s.name} name={s.name} className={s.className} />
              ))}
            </div>
          </Section>

          <Section
            title="Colour — semantic"
            description="What components actually consume. These are the values that flip between themes."
          >
            <div className="flex flex-wrap gap-3">
              {SEMANTIC_SWATCHES.map((s) => (
                <Swatch key={s.name} name={s.name} className={s.className} />
              ))}
            </div>

            <div className="mt-8 space-y-1">
              {TEXT_TOKENS.map((t) => (
                <p key={t.name} className={`text-lg ${t.className}`}>
                  {t.name} — The quick brown fox jumps over the lazy dog
                </p>
              ))}
            </div>
          </Section>

          <Section
            title="Colour — status"
            description="Each tone carries four steps: subtle for fills, base for marks, strong for text, and on for content sitting on the base."
          >
            <div className="space-y-4">
              {STATUS_RAMPS.map((ramp) => (
                <div key={ramp.tone} className="flex flex-wrap items-center gap-3">
                  <span className="w-20 font-mono text-xs uppercase text-text-muted">
                    {ramp.tone}
                  </span>
                  {ramp.steps.map((step) => (
                    <Swatch
                      key={step.name}
                      name={step.name}
                      className={step.className}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Elevation, radius, motion"
            description="The hard shadow is the brand signature; soft elevation is reserved for overlays that must not read as pressable."
          >
            <div className="flex flex-wrap gap-6">
              {[
                { name: "shadow-hard-sm", cls: "shadow-hard-sm" },
                { name: "shadow-hard", cls: "shadow-hard" },
                { name: "shadow-hard-lg", cls: "shadow-hard-lg" },
                { name: "shadow-soft", cls: "shadow-soft" },
                { name: "shadow-panel", cls: "shadow-panel" },
              ].map((s) => (
                <div key={s.name} className="w-40">
                  <div
                    className={`h-20 rounded-2xl border-2 border-border-strong bg-surface ${s.cls}`}
                  />
                  <p className="mt-3 font-mono text-[11px] text-text-muted">
                    {s.name}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Button"
            description="Six variants, four sizes, and a loading state that blocks interaction and announces itself."
          >
            <Row label="variants">
              {BUTTON_VARIANTS.map((v) => (
                <Button key={v} variant={v} size="sm">
                  {v}
                </Button>
              ))}
            </Row>
            <Row label="sizes">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add">
                +
              </Button>
            </Row>
            <Row label="states">
              <Button size="sm">Rest</Button>
              <Button size="sm" disabled>
                Disabled
              </Button>
              <Button size="sm" loading>
                Loading
              </Button>
              <Button size="sm" loading loadingText="Saving…">
                Save
              </Button>
            </Row>
            <Row label="full width">
              <div className="w-80">
                <Button fullWidth>Continue</Button>
              </div>
            </Row>
          </Section>

          <Section
            title="Input"
            description="Label, hint, error, and success are part of the field — not something each form re-invents. Messages are wired to the input with aria-describedby."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Email"
                required
                type="email"
                placeholder="creator@vision.app"
                hint="We'll never share this."
                leadingIcon={<HomeIcon className="size-5" />}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                trailingIcon={<EyeIcon className="size-5" />}
              />
              <Input
                label="Slug"
                defaultValue="my first post"
                error="Slug must be URL-safe."
              />
              <Input
                label="Slug"
                defaultValue="my-first-post"
                success="Available."
              />
              <Input label="Disabled" placeholder="Unavailable" disabled />
              <Input label="Read only" defaultValue="creator@vision.app" readOnly />
              <Input label="Small" inputSize="sm" placeholder="sm" />
              <Input label="Large" inputSize="lg" placeholder="lg" />
            </div>
          </Section>

          <Section title="Checkbox">
            <div className="grid max-w-md gap-5">
              <Checkbox
                label="Email me when a Post is published"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <Checkbox label="Unchecked" defaultChecked={false} />
              <Checkbox label="Indeterminate" indeterminate />
              <Checkbox label="Disabled" disabled />
              <Checkbox
                label="I accept the terms"
                error="You must accept the terms to continue."
              />
            </div>
          </Section>

          <Section
            title="Card"
            description="Interactive pairs the hard shadow with a press displacement — use it only on a real control."
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {(["default", "elevated", "outline", "interactive"] as const).map(
                (variant) => (
                  <Card key={variant} variant={variant}>
                    <CardHeader>
                      <CardTitle className="text-xl">{variant}</CardTitle>
                      <CardDescription>Card variant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary">
                        Views this week: 1,284
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </Section>

          <Section title="Badge">
            <Row label="subtle">
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
            </Row>
            <Row label="solid">
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone} appearance="solid">
                  {tone}
                </Badge>
              ))}
            </Row>
            <Row label="outline">
              {BADGE_TONES.map((tone) => (
                <Badge key={tone} tone={tone} appearance="outline">
                  {tone}
                </Badge>
              ))}
            </Row>
          </Section>

          <Section
            title="Alert"
            description="Error alerts announce immediately; the rest are polite."
          >
            <div className="grid gap-4">
              <Alert tone="info" title="Draft saved">
                Your Post is saved but not yet visible to Readers.
              </Alert>
              <Alert tone="success" title="Published">
                Your Post is Published at /blog/my-first-post — Readers can see
                it now.
              </Alert>
              <Alert tone="warning" title="Plan limit approaching">
                You have used 9 of 10 Multi-Channel Sync broadcasts this month.
              </Alert>
              <Alert tone="error" title="Publish failed" onDismiss={() => {}}>
                The slug is already taken by another Post.
              </Alert>
            </div>
          </Section>

          <Section title="Spinner and Label">
            <Row label="spinner">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </Row>
            <Row label="label">
              <Label>Plain label</Label>
              <Label required>Required label</Label>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  );
}
