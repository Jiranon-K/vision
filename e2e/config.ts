// The E2E environment is composed explicitly and never inherited from the
// developer's shell. Inheriting would let a real RESEND_API_KEY reach the test
// run, and every registration in the suite would send a real email.
export const E2E_WEB_PORT = 3100;
export const E2E_API_PORT = 3101;

export const WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
export const API_URL = `http://localhost:${E2E_API_PORT}`;

// Must end in `_e2e` — global-setup refuses to wipe anything else.
export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI || 'mongodb://localhost:27017/vision_e2e';

export const CREATOR = {
  email: 'creator@e2e.local',
  password: 'E2ePass1!',
  name: 'E2E Creator',
};

export const STORAGE_STATE = 'e2e/.auth/creator.json';

export const SEEDED_PUBLISHED_POST = {
  title: 'Seeded Published Post',
  content:
    'This post is seeded by the E2E setup project so the public blog has something to render.',
  category: 'SEO',
  status: 'Published' as const,
};

export const SEEDED_DRAFT_POST = {
  title: 'Seeded Draft Post',
  content: 'This draft must never be visible to an anonymous reader.',
  category: 'Content',
  status: 'Draft' as const,
};

// Fixtures below are for the README screenshots only (e2e/readme-shots.spec.ts).
// They are deliberately not seeded by auth.setup.ts: that file runs before every
// e2e project, and the regression specs assert against the small SEEDED_* set.
export const SHOTS_DIR = 'docs/images';

export const DEMO_CREATOR = {
  email: 'demo@vision.local',
  password: 'E2ePass1!',
  name: 'Mara Lindqvist',
};

// Created in order. The posts list sorts by createdAt descending, so the Draft
// lands at the top of the dashboard's Recent Posts and gives the shot one Draft
// chip among Published ones.
//
// The split is deliberate: two Featured Posts fill the blog's two-column
// Featured row, and three more fill the three-column Latest grid, so neither
// row has a hole in it in the README screenshot.
export const DEMO_POSTS = [
  {
    title: 'Write Once, Broadcast Everywhere',
    category: 'Social Media',
    status: 'Published' as const,
    featured: true,
    views: 4_820,
    excerpt:
      'Multi-Channel Sync turns one publish action into a coordinated release. Write the Post once, and let every channel your Audience already reads receive it in the shape that channel expects.',
    content: `**One Post. Every channel your Audience already reads.** Multi-Channel Sync exists because the work of reshaping a single idea for five destinations is the work that stops Creators from publishing at all.

## What syncing actually does

When you move a Post from Draft to Published, Vision holds one canonical body and derives a channel-shaped version of it for each destination you have connected. The Excerpt becomes the summary. The first heading becomes the hook. The Category decides which of your channels are in scope at all.

- The canonical Post stays the single source of truth — edit it once, and the correction travels.
- Each channel keeps its own cadence, so a broadcast never arrives five times in one minute.
- Every derived release links back to the Post, so Views land where you can read them.

## Why the canonical body matters

> A Creator who maintains five copies of the same idea is maintaining five chances to be wrong in public.

The alternative — writing five near-identical drafts by hand — looks like more control and is actually less. The moment one of them is corrected and the others are not, your Audience meets two versions of you.

## Where to start

Publish one Post to two channels before you connect a third. Read the weekly Views. The channel that earns attention is the one worth shaping for; the rest are a hypothesis you have not tested yet.`,
  },
  {
    title: 'The Anatomy of a Post That Keeps Earning Views',
    category: 'Content',
    status: 'Published' as const,
    featured: true,
    views: 3_190,
    excerpt:
      'Most Posts peak in a week and go quiet. The ones that keep earning Views share a structure — a promise in the first line, a payoff before the fold, and a reason to come back.',
    content: `**Most Posts peak within a week.** A few keep earning Views for a year, and they are not the ones that were shouted loudest on the day they were Published.

## The three parts that carry the weight

A durable Post makes a promise, keeps it early, and leaves something behind.

- **The promise.** The first line names the problem the Reader arrived with. Not your credentials, not the history of the field — the problem.
- **The payoff.** The answer appears before the fold. Withholding it does not build suspense; it builds a closed tab.
- **The residue.** One idea worth repeating to a colleague. That sentence is what gets your Post shared six months from now.

## What the Views are telling you

> A spike is an event. A floor is a structure.

Watch the floor a Post settles to a month after publishing, not the peak it reached on day one. The peak measures your distribution. The floor measures the Post.

## Editing toward durability

Cut the paragraph that explains why the topic matters — the Reader who searched for it already knows. Keep the Excerpt honest: it is the promise a Reader reads before they decide to spend a minute with you, and an Excerpt that oversells is the fastest way to teach an Audience to skip you.`,
  },
  {
    title: 'Search Visibility Without the Guesswork',
    category: 'SEO',
    status: 'Published' as const,
    featured: false,
    views: 2_415,
    excerpt:
      'Search Visibility is not a dark art. It is a Category you chose on purpose, a Slug you can read aloud, and an Excerpt that answers the question the Reader typed.',
    content: `**Search Visibility is not a dark art.** It is a handful of decisions you already make when you publish a Post, made deliberately instead of by default.

## The decisions that matter

- **The Slug.** Short, readable aloud, and stable. A Slug that changes after a Post has been Published throws away every link pointing at it.
- **The Category.** One Category, chosen because it is where this Post belongs — not because it is where you publish most often.
- **The Excerpt.** Write it as the answer to the question a Reader typed. It is the sentence they read before deciding whether to click.

## What not to spend time on

> If a change would embarrass you to explain to a Reader, it will eventually embarrass you to explain to a search engine.

Keyword density, synonym padding, and headings written for machines all optimise for a Reader who does not exist. The Post that ranks is usually the Post that answered the question completely and did not waste the first screen.

## Measuring it honestly

Growth Analytics shows Views, not intent. A Post with modest Views from a Category your Audience actually buys from is worth more than a viral one that brought Readers who never return. Judge Search Visibility by which Posts keep earning Views a month later.`,
  },
  {
    title: 'What Your Growth Analytics Actually Tell You',
    category: 'Analytics',
    status: 'Published' as const,
    featured: false,
    views: 1_760,
    excerpt:
      'A weekly View count is a fact. What it means is a judgement. Here is how to read Growth Analytics without flattering yourself into the wrong decision.',
    content: `**A weekly View count is a fact. What it means is a judgement.** Growth Analytics is useful exactly to the degree that you keep those two things apart.

## Reading the weekly trend

Seven days of Views is enough to see a shape and not enough to see a cause. Before you act on a rise, ask what else changed that week — a broadcast, a link from elsewhere, a Post that happened to land on a slow news day.

- **A single spike** is almost always distribution, not content.
- **A rising floor** across several Posts is the signal worth acting on.
- **A flat week after a publish** usually means the Excerpt did not make a promise.

## The trap of the flattering metric

> Every Creator has one number that always looks good. That is the number to stop reading.

Subscribers only counts people who agreed to hear from you; it says nothing about whether they still read. Engagement is an average, and averages hide the difference between a small Audience that reads everything and a large one that reads nothing.

## Turning a reading into a decision

Pick the Category with the highest floor and publish into it twice more. If the floor holds, you have found something. If it does not, you have spent two Posts learning that cheaply — which is the entire point of measuring.`,
  },
  {
    title: 'The Channel You Own Beats the Channel You Rent',
    category: 'Marketing',
    status: 'Published' as const,
    featured: false,
    views: 1_340,
    excerpt:
      'Every broadcast channel can change its rules overnight. The list of Readers who asked to hear from you cannot be taken away — which is why it is worth more than the reach that looks bigger.',
    content: `**Reach you rent can be repriced. An Audience you own cannot.** That is the whole argument, and every Creator learns it the week a channel changes how it distributes.

## What owning a channel means

It means you hold the connection to the Reader, not an intermediary. A Subscriber who asked for your Posts arrives whatever a ranking model decided this month.

- Rented reach is elastic — excellent while it lasts, gone without notice.
- Owned reach is small and slow, and it compounds.
- The two are not rivals: rented reach is how you find the people who then choose to stay.

## Turning a View into a Subscriber

> A Reader who finishes a Post is the only Reader worth asking for anything.

Ask at the end, not the beginning. Ask for one thing. Say what they get and how often, and then hold to it — a promise you break once costs you the Subscriber twice.

## Measuring the trade

Compare the Views a broadcast earned against the Subscribers it converted. A channel that sends thousands of Readers who never return is a channel you are renting expensively, whatever the Growth Analytics headline says.`,
  },
  {
    title: 'Building a Brand Voice Your Audience Recognises',
    category: 'Branding',
    status: 'Draft' as const,
    featured: false,
    views: 0,
    excerpt:
      'A Draft on brand voice — the vocabulary, cadence, and refusals that make a Creator recognisable across every channel before the logo loads.',
    content: `**A voice is recognisable before the logo loads.** This Draft is about what makes that true: the vocabulary you keep, the cadence you hold, and the things you refuse to say.

## Vocabulary

Every Creator accumulates a small set of words they use precisely and a larger set they avoid. Writing both lists down turns a habit into something a second person can follow — and something you can hold onto across five channels.

- Words you own, used the same way every time.
- Words you refuse, and the reason why.
- The terms your Audience uses that you had better not correct.

## Cadence

> Consistency of rhythm reads as confidence. Consistency of volume reads as noise.

Cadence is sentence length and paragraph shape more than it is posting frequency. A voice that alternates a long, careful explanation with a four-word verdict is legible even when the topic is not.

## Refusals

What you will not do defines a voice faster than what you will. No manufactured urgency. No claim you would not repeat to a Reader's face. Written down, refusals stop being taste and start being a standard — which is what makes a voice survive a second Creator joining.`,
  },
];

// Seven days ending today, rising with a mid-week dip so the weekly chart shows
// a shape rather than a staircase.
export const DEMO_PAGE_VIEWS = [612, 740, 690, 905, 1_120, 1_045, 1_284];
export const DEMO_SUBSCRIBERS = 2_431;
export const DEMO_ENGAGEMENT = 68;

export const DEMO_EDITOR_TITLE = 'Multi-Channel Sync: One Post, Every Channel';
export const DEMO_EDITOR_CONTENT = `## One Post, every channel

**Multi-Channel Sync** derives a channel-shaped release from one canonical Post,
so a correction you make once travels everywhere it was broadcast.

- The Excerpt becomes the summary each channel shows.
- The Category decides which channels are in scope.
- Every release links back, so Views land in one place.

> A Creator maintaining five copies of an idea is maintaining five chances to be
> wrong in public.

\`\`\`bash
bun run dev:all
\`\`\`
`;

// Mirrors generateUniqueSlug in server/src/controllers/posts.controller.ts.
// Only valid for titles that are unique across the run — which every title
// this suite creates is.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
}

export const serverEnv: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: String(E2E_API_PORT),
  MONGODB_URI: E2E_MONGODB_URI,
  JWT_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
  FRONTEND_URL: WEB_URL,
  // Deliberately fake. server/src/emails/client.ts builds a Resend client
  // straight from this value and has no stub path.
  RESEND_API_KEY: 're_e2e_fake_key',
  EMAIL_FROM: 'noreply@e2e.local',
  EMAIL_FROM_NAME: 'Vision E2E',
  ADMIN_EMAILS: '',
};

export const webEnv: Record<string, string> = {
  NEXT_PUBLIC_API_URL: API_URL,
  NEXT_PUBLIC_SITE_URL: WEB_URL,
  // Keeps the E2E run off the developer's `.next` lock (see next.config.ts).
  NEXT_DIST_DIR: '.next-e2e',
  // The suite seeds the database after the web server is up, so ISR must be off
  // or every page renders the listing as it was before the seed (see lib/posts.ts).
  POSTS_REVALIDATE: '0',
};
