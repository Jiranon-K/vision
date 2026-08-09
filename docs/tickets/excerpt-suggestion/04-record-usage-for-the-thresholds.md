# 04 — Excerpt Suggestion usage recorded so the go/no-go thresholds can be answered

**What to build:** The whole reason the suggestion is a button a Creator presses, rather than something that happens silently while saving, is that a button can be counted. This ticket makes the counting real, so two agreed thresholds can be checked with data instead of argued about with impressions.

The thresholds, fixed before any of this was built:

- **Under 25% adoption in 30 days → stop.** No further AI capability gets built.
- **Under 40% used unedited → the prompt is the problem, not the idea.** Fix the prompt before reaching for a different model.

Every time an Excerpt Suggestion is issued, that fact is recorded: which Creator, which Post if it has been saved, the suggested text, and when. Storing the suggested text is what makes the second threshold answerable — when the Post is later saved, its Excerpt can be compared against what was suggested, revealing whether the Creator used it as-is, edited it, or discarded it.

Two things this deliberately does not do. **No flag on the Post** — a field claiming an Excerpt is AI-written cannot be honest, because the suggestion lands in an editable field and a Creator may keep a word of it or none; only the event is knowable. **No new screen** — these numbers get queried by hand, roughly monthly, to answer a go/no-go question, and building a dashboard for a capability that has not yet earned its place is investment stacked on investment.

The existing analytics document is a daily rollup of Reader Views per Post. This is a Creator's action, not a Reader's read; putting it there would make one model serve two unrelated purposes.

**Blocked by:** 02 — there is nothing to record until suggestions are being issued. Independent of 03; the two can proceed in parallel.

**Status:** ready-for-agent

- [ ] Every issued Excerpt Suggestion is recorded durably, surviving a server restart
- [ ] A recorded suggestion is attributable to a Creator, and to a Post once one exists
- [ ] The recorded text is retained so a later Excerpt can be compared against it
- [ ] The existing analytics model is unchanged, and the Post model gains no field
- [ ] Recording never blocks or fails a Creator's request — a write failure is logged, not surfaced
- [ ] Documented, runnable queries answer both numbers: share of published Posts where a suggestion was asked for, and share of suggestions kept unedited
- [ ] The two thresholds and what to do at each are written down next to the queries
- [ ] No user interface is added
