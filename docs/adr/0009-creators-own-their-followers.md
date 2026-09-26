# ADR 0009: Vision's core is a Creator owning their Followers, reached by email

Status: Accepted. Supersedes the share-kit half of ADR 0008; its other two
decisions stand: Vision never posts on a social channel, and no Plan is sold
during the Free beta.

## Context

ADR 0008 redefined Multi-Channel Sync as a share kit: Vision prepares a Post
for each social channel and the Creator shares it by hand. It removed the
integration burden, but it does not solve the Creator's problem. A Post shared
to a channel still reaches whoever that channel's algorithm decides it reaches,
and the Readers it gathers belong to the channel. A Creator with ten thousand
followers on a page can have a Post seen by a few hundred, and loses all of
them if the page is removed.

The alternatives considered were a share kit (ADR 0008), a per-Creator RSS
feed for third-party auto-posting tools, a per-Creator home page, and
AI-suggested topics from Growth Analytics. None of them gives the Creator a
way to reach a Reader that no third party controls.

## Decision

**A Reader can follow a Creator by email, and a Creator can deliver a
Published Post to every Follower.** Following needs no account and is
confirmed by the Reader before it counts. A Follower follows one Creator, and
can stop at any time from any Delivery.

**The Followers belong to the Creator, not to Vision.** The Creator can see the
list and export it; an Admin sees only a count. When a Creator leaves Vision,
their Followers are deleted with the account rather than kept.

**A Delivery sends the Follower to the Post rather than containing it.** It
carries the title and Excerpt, and the read happens on the Post, so it is a
View and Growth Analytics can report how many Views Deliveries brought.

## Consequences

- Vision now holds Readers' personal data. Confirmation before following, a
  one-click stop in every Delivery, Creator-only access and deletion with the
  account are what make holding it defensible under Thailand's Personal Data
  Protection Act.
- Vision's email sending moves from a handful of account emails to one email
  per Follower per Delivery. Sending volume, and its cost, grows with the
  Creators' success; during the Free beta a platform-wide daily limit queues
  what does not fit.
- Export is a promise that Vision can be left. It is what separates owning an
  Audience from renting one from another platform, and it must not be removed
  to improve retention.
- A Delivery containing only the Excerpt costs the Follower one click to read.
  In exchange every read is counted, and the Post's Slug, not the email, is
  what a Follower shares.
- A Follower who stops leaves an anonymous record: which Creator, when they
  followed, when they stopped. No address and no token. It is what lets
  Growth Analytics say how many Followers a Creator had in a past week
  without keeping anything that points back at a person (Jiranon-K/vision#31).
- A per-Creator home page, importing an existing list, and LINE Official
  Account delivery are left for later; none is needed to reach a Follower.
