# 02 — A Creator can ask for an Excerpt Suggestion from the editor

**What to build:** Today a Creator who leaves the Excerpt field blank gets the first 150 characters of their Post with an ellipsis stuck on the end, and that string is what Google is shown as the Post's description — the blog's page metadata uses the Excerpt verbatim. This ticket gives the Creator a way to get a real summary instead.

In the editor, beside the Excerpt field, a Creator can ask for an Excerpt Suggestion. The suggestion arrives in the Excerpt field itself, in the same language as the Post, and is immediately editable — it is a starting point the Creator owns, not a decision made for them.

This is the tracer bullet: one narrow path through the provider call, the API, and the editor, covering the states where everything goes right.

| State    | When                                         | What the Creator sees                               |
| -------- | -------------------------------------------- | --------------------------------------------------- |
| hidden   | the server has no provider credentials       | no button at all                                    |
| disabled | the Post has too little content to summarise | button present, not clickable                       |
| idle     | ready                                        | normal button                                       |
| loading  | request in flight                            | button disabled, progress indicated                 |
| filled   | success                                      | suggestion in the Excerpt field, confirmation shown |

Deliberately out of scope — the Excerpt field already containing text, the provider failing, and a Creator asking too often. Those are ticket 03. Until it lands, the happy path is the only path.

The shape of the work: a module the rest of the server talks to in domain terms, taking a Post's content and returning an Excerpt Suggestion, with the provider call injected rather than imported so it can be replaced in tests and later by a Creator-supplied key or a self-hosted model. The editor calls it with content alone, not a saved Post — a Creator will ask for a suggestion before the Post has ever been saved. The prompt asks for a short summary, in the content's language, as plain prose with no Markdown; what comes back is treated as untrusted, with length enforced in code by the existing excerpt-bounding helper, which already avoids cutting a Thai character or emoji in half. The default model is Gemini 3.1 Flash-Lite, changeable by configuration without a code change.

The editor needs to know whether this deployment has the capability at all, and feature state must have exactly one source of truth — the server that holds the credentials — never a separate frontend flag that can drift out of step with it.

Vision must remain fully runnable with no provider credentials: cloning the repo, running the verification suite, and running the Playwright suite must not require an AI account.

**Blocked by:** 01 — the term and both decisions must be recorded first; this ticket is written in that vocabulary and constrained by both ADRs.

**Status:** ready-for-agent

- [ ] With credentials configured, a Creator writing a Post can ask for an Excerpt Suggestion and receives a real summary of that Post in the Excerpt field, editable in place
- [ ] A Thai-language Post yields a Thai suggestion; an English Post yields English
- [ ] A suggestion longer than the Excerpt bound is shortened without breaking a multi-byte character
- [ ] With no credentials configured the button does not render, and the capability is reported as unavailable from a single server-side source of truth
- [ ] `bun run verify:fast` passes with no provider credentials present
- [ ] Unit tests cover the module with a stubbed provider — no test performs a real network call
- [ ] A Playwright test covers a Creator asking for a suggestion and seeing it land in the field
- [ ] `server/src/utils/postContent.ts` is unchanged and stays free of I/O
- [ ] Neither creating nor updating a Post calls a provider
