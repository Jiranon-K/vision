# ADR 0008: Vision prepares a Post for each channel; the Creator shares it, and nothing is sold yet

Status: Accepted. The share-kit decision is superseded by ADR 0009; the other two decisions stand.

## Context

The marketing site sells two things the product does not do. Multi-Channel
Sync is described as publishing one Post to every social platform from a
single click, and the pricing page sells Starter, Pro and Business Plans. No
server code posts to a social channel, and none charges a Creator.

Posting on a Creator's behalf means one integration per channel, each with its
own gate: X charges for write access to its API, Facebook and Instagram require
an app review, and LinkedIn requires a partner program. Every one needs its own
OAuth connection, token storage and ongoing maintenance, and any of them can
change terms and break the feature. That is more than the product can carry
now, and none of it is under Vision's control.

## Decision

**Vision never posts on a social channel. It prepares a Published Post for
each channel, and the Creator shares it themselves.** Multi-Channel Sync means
a share kit shown after publishing: text shaped for each channel (a thread for
X, a longer post for LinkedIn, a short caption for Facebook and LINE), a copy
action, a share link that opens the channel with that text already filled in,
and a tracked link per channel so Growth Analytics reports which channel
brought each View.

**No Plan is sold during the Free beta.** Every Creator has every Capability
Vision has built, and the pricing page says so instead of listing prices for
things that do not exist.

## Consequences

- No channel API keys, OAuth connections or stored channel tokens. A channel
  changing its API terms cannot break Vision.
- Sharing costs the Creator one click per channel instead of zero. That is the
  price of not depending on channel approval.
- Growth Analytics gains a dimension: the channel a View arrived from.
- The pricing and services copy must change to match: Multi-Channel Sync is
  described as share-ready, not auto-posted, and Plans read as Free beta.
- Charging for Plans later needs its own decision; this ADR does not choose a
  payment provider.
