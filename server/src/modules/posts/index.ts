// The Posts module's interface (ADR 0007). Anything not exported here, or from
// posts.routes.ts for mounting, is internal to the module.
export { syncCreatorByline } from './post.model';
export { safeSlice, stripMarkdown, EXCERPT_MAX } from './content';
export { creatorTotals, publishedPostIds, currentExcerpts } from './posts.queries';

// The model itself, for data migrations and operator scripts only: they rewrite
// stored documents below the rules. Another module asks through the functions
// above instead, and ESLint holds it to that.
export { default as Post } from './post.model';
