# 01 — Excerpt Suggestion recorded as domain language and two decisions

**What to build:** Vision is about to gain its first AI-backed capability. Before any of it is built, the vocabulary it will be written in and the two decisions that constrain it must exist in the repo, so every following ticket names things the same way.

The domain gains one term: an **Excerpt Suggestion** is text the platform proposes as a Post's Excerpt. It is not an Excerpt — `CONTEXT.md` defines an Excerpt as something shown to Readers in listings and previews, and a suggestion is shown to nobody until the Creator accepts it. Without the separate term, code and conversation call both things "excerpt" and the question "has the Creator agreed to this one?" becomes unaskable.

Two decisions need recording because a future reader will otherwise wonder why the code is shaped this way, and because reversing either is expensive.

**No AI on the save or publish path.** Suggesting an Excerpt is a separate, Creator-initiated action. If a provider is unreachable, a Creator must still be able to publish. This is worth an ADR precisely because the obvious-looking change — calling the provider while saving so the Excerpt is always good — makes publishing depend on a third party's uptime.

**Provider access sits behind a seam this repo owns.** The rest of the server asks for an Excerpt Suggestion and never learns which provider, model, or prompt produced it. The reasons are concrete: cheap models are retired on a months-long cadence (Gemini 2.5 Flash-Lite retires 16 Oct 2026), and two plausible future directions — letting a Creator supply their own API key, or self-hosting an open model — are both "swap the provider" rather than a rewrite. The rejected alternatives were hand-written adapters per provider, and routing everything through an OpenRouter-style gateway.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `CONTEXT.md` defines **Excerpt Suggestion** under Publishing, in the same format as the terms around it, with an _Avoid_ list
- [ ] The definition makes clear it is distinct from an Excerpt, and what changes when a Creator accepts one
- [ ] `CONTEXT.md` stays a glossary — no endpoint names, model names, or implementation detail
- [ ] An ADR records the no-AI-on-the-save-path invariant, including what goes wrong if it is broken
- [ ] An ADR records the provider seam, including the model-retirement and bring-your-own-key/self-host reasoning, and the two rejected alternatives
- [ ] Both ADRs follow the existing numbering and format in `docs/adr/`
