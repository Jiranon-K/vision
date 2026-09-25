# Vision

Vision is a publishing platform for content creators: write a piece once, broadcast it to social channels, and grow an audience with built-in discovery and analytics. This repo holds the public marketing site, the blog, and the creator's dashboard.

## Language

### Publishing

**Post**:
A single piece of writing authored in Vision — the only unit of content the platform publishes.
_Avoid_: Article, Blog post, Entry, Story

**Draft**:
A Post its Creator has not released. Invisible to Readers, and the Creator may publish it at will — unlike a Withheld Post, whose invisibility is not the Creator's to undo.
_Avoid_: Unpublished, Pending

**Published**:
A Post its Creator has released to Readers. Visible on the public blog unless it is Withheld.
_Avoid_: Live, Public

**Withheld**:
A Published Post that Vision has stopped showing to Readers. Only an Admin can withhold or restore one; the Creator can still edit it but cannot make it visible again.
_Avoid_: Taken down, Banned, Suspended, Hidden, Unpublished

**Slug**:
The URL-safe identifier a Published Post is read at. Stable and unique across Posts.
_Avoid_: Permalink, Path, Handle

**Excerpt**:
A short summary of a Post, shown in listings and previews instead of its full content.
_Avoid_: Summary, Description, Teaser, Snippet

**Excerpt Suggestion**:
Text the platform proposes as a Post's Excerpt. It is not an Excerpt — it is shown to nobody until the Creator accepts it, where an Excerpt is shown to Readers in listings and previews. Accepting one replaces the Post's Excerpt with the suggested text; until then the Post's Excerpt is unchanged.
_Avoid_: Suggested excerpt, AI excerpt, Generated excerpt, Draft excerpt

**Category**:
The single topic a Post belongs to, chosen from a fixed marketing-oriented set (Marketing, SEO, Content, Social Media, Analytics, Branding).
_Avoid_: Tag, Topic, Section

**Featured**:
A flag marking a Post for prominent placement on the blog. Editorial emphasis only — it says nothing about the Post's popularity.
_Avoid_: Highlighted, Pinned, Top post

### People

**Creator**:
A person with an account who writes and publishes Posts through the dashboard, and whom those Posts are attributed to. The customer of the product.
_Avoid_: User, Author, Blogger, Publisher, Writer, Account

**Byline**:
The short self-description a Creator writes about themselves, shown to Readers beneath their name on a Post. Chosen by the Creator, and unrelated to what they are permitted to do.
_Avoid_: Title, Role, Job title, Tagline

**Admin**:
A member of Vision's own staff, who can read every Creator's Posts and Withhold one. Not a senior Creator and not a tier above one — a different kind of person entirely.
_Avoid_: Superuser, Owner, Moderator, Staff, Editor

**Reader**:
Anyone who reads the public marketing pages or the blog. Never signed in; readership requires no account.
_Avoid_: Visitor, Guest, Audience member

### Audience and growth

**View**:
One recorded read of a Published Post. Counted per Post and reported to its Creator. Deduplicated per Reader per Post over a window measured in hours, so a refresh is not a second View and a Reader returning the next day is. A Draft accumulates none, and a known crawler is not a Reader.
_Avoid_: Hit, Impression, Read, Pageview

**Audience**:
The Readers a Creator has reached. The thing the product exists to grow.
_Avoid_: Following, Traffic, Userbase

### Plans and capabilities

**Plan**:
A tier of paid access to Vision — Starter, Pro, or Business — priced per Creator.
_Avoid_: Tier, Package, Subscription, Product

**Subscriber**:
A Creator currently paying for a Plan. Never means a Reader who signed up for email updates.
_Avoid_: Paying user, Customer, Member

**Billing period**:
Whether a Plan is priced monthly or yearly. Yearly is the discounted rate for the same Plan.
_Avoid_: Billing cycle, Term, Interval

**Capabilities** are the named units of value a Plan grants. They are the product's marketed vocabulary and must be used verbatim on the pricing and services pages:

**Smart Creator Hub**:
The dashboard where a Creator writes, manages, and publishes Posts.

**Search Visibility**:
Making a Creator's Published Posts discoverable through search.

**Audience Connect**:
Reaching and retaining a Creator's Audience directly.

**Content Boosting**:
Amplifying the reach of a Published Post beyond its organic Audience.

**Multi-Channel Sync**:
Broadcasting one Post to multiple social channels from a single publish action.

**Growth Analytics**:
Reporting on Views and Audience growth back to the Creator.
