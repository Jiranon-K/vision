import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Two rules written here rather than pulled from a plugin. They are small, and
// the supply chain for a lint plugin is not worth two regexes.
const local = {
  rules: {
    // An eslint-disable without a reason is a decision nobody can review later.
    // ESLint's own `--`-suffix convention is the description.
    "disable-needs-reason": {
      meta: {
        type: "suggestion",
        docs: { description: "require a `-- reason` on every eslint-disable" },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              const text = comment.value.trim();
              if (!/^eslint-disable(-next-line|-line)?\b/.test(text)) continue;
              if (text.includes("--")) continue;
              context.report({
                loc: comment.loc,
                message:
                  "Explain the disable: `// eslint-disable-next-line rule -- why this is correct here`.",
              });
            }
          },
        };
      },
    },

    // A TODO with no issue behind it is a note to nobody. With one, it is a
    // tracked decision that survives the person who wrote it.
    "todo-needs-issue": {
      meta: {
        type: "suggestion",
        docs: { description: "require an issue reference on TODO/FIXME" },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              // Only a marker counts — one that opens a line, optionally after
              // a block-comment asterisk. Prose that happens to contain the
              // word is not a marker, and flagging it would teach people to
              // contort sentences instead of opening issues.
              const marker = comment.value
                .split("\n")
                .map((line) => /^[\s*]*(TODO|FIXME|HACK|XXX)\b/.exec(line))
                .find(Boolean);
              if (!marker) continue;
              if (/#\d+/.test(comment.value)) continue;
              context.report({
                loc: comment.loc,
                message: `${marker[1]} needs an issue reference, e.g. \`${marker[1]}(#42): ...\`. Open one with \`gh issue create\`.`,
              });
            }
          },
        };
      },
    },

    // One case convention for every file (ADR 0007). A rename that differs
    // only in case works on Windows and breaks the Linux build.
    "file-name-kebab-case": {
      meta: {
        type: "suggestion",
        docs: { description: "require kebab-case file names" },
        schema: [],
      },
      create(context) {
        return {
          Program(node) {
            const name = context.filename.split(/[\\/]/).pop();
            if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(name)) return;
            context.report({
              node,
              message: `Name files in kebab-case: \`${name}\` (ADR 0007).`,
            });
          },
        };
      },
    },

    // The marketing site once sold what Vision never built, twice over: ADR
    // 0008 recorded it and the copy stayed. The claims that were false are
    // named here, so they cannot come back without someone deleting a line
    // (Jiranon-K/vision#35).
    "no-retired-claims": {
      meta: {
        type: "problem",
        docs: { description: "keep claims about unbuilt or retired features off the marketing copy" },
        schema: [],
      },
      create(context) {
        const check = (node, text) => {
          const claim = RETIRED_CLAIMS.find(({ pattern }) => pattern.test(text));
          if (claim) context.report({ node, message: `${claim.why} (Jiranon-K/vision#35).` });
        };
        return {
          Literal(node) {
            if (typeof node.value === "string") check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.cooked ?? node.value.raw);
          },
          JSXText(node) {
            check(node, node.value.replace(/\s+/g, " "));
          },
        };
      },
    },
  },
};

const RETIRED_CLAIMS = [
  { pattern: /multi-?channel sync|social sync/i, why: "Multi-Channel Sync is retired: Vision never posts on a social channel (ADR 0008, 0009)" },
  { pattern: /broadcast/i, why: "Vision does not broadcast a Post anywhere; a Delivery reaches Followers by email (ADR 0009)" },
  { pattern: /(instantly|automatically|one[- ]click|single click)[^.]*(social|facebook|twitter|linkedin|instagram)/i, why: "Vision never posts on a social channel for the Creator (ADR 0008)" },
  { pattern: /content boosting/i, why: "Content Boosting is retired and was never built" },
  { pattern: /\bsubscri(be|bers?|ption)\b/i, why: "A Reader follows a Creator; say Follower, not Subscriber (CONTEXT.md)" },
  { pattern: /฿\s*[1-9]|\/mo\b|per (month|year)|(monthly|yearly) (plan|billing)|\b(starter|pro|business) plan\b/i, why: "No Plan is sold during the Free beta (ADR 0008)" },
  { pattern: /real-time|AI[- ](powered|driven|writing)/i, why: "Growth Analytics is not real-time, and Vision's only AI is an optional Excerpt suggestion" },
  { pattern: /\b(comments|reactions)\b/i, why: "Posts have no comments or reactions" },
];

// Every file that holds marketing copy: the public pages, their sections and
// the site-wide description, footer and social preview.
const MARKETING_COPY = [
  "src/features/marketing/**/*.{ts,tsx}",
  "src/features/blog/components/creator-cta.tsx",
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/services/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/opengraph-image.tsx",
  "src/shared/layout/footer.tsx",
  "src/shared/layout/navbar.tsx",
  "src/shared/lib/site.ts",
];

// Where the layout of ADR 0007 is enforced: features and modules are entered
// through their entry files, shared/ and platform/ import neither, and every
// file is kebab-case.
const LAYOUT = "error";
const FEATURE_ENTRY =
  "Import a feature through its entry file — `@/features/x` or `@/features/x/server` (ADR 0007).";
const MODULE_ENTRY =
  "Import a server module through its entry file, `modules/x/index` — or `modules/x/x.routes` to mount it (ADR 0007).";
const NO_FEATURE_IN_SHARED = "shared/ never imports a feature (ADR 0007).";
const NO_MODULE_IN_PLATFORM = "platform/ never imports a module (ADR 0007).";
const intoFeature = {
  group: ["@/features/*/*", "!@/features/*/server"],
  message: FEATURE_ENTRY,
};
const intoModule = {
  regex: "(^|/)modules/[^/]+/(?!(index|[^/]+\\.routes)(\\.js)?$)",
  message: MODULE_ENTRY,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // design-sync working trees: staged third-party converter scripts, its
    // generated bundle, and the type declarations emitted for it. All
    // regenerated by `cfg.buildCmd`, none of it authored here.
    ".ds-sync/**",
    "ds-bundle/**",
    "dist/**",
  ]),
  {
    linterOptions: {
      // A disable that no longer suppresses anything is stale context.
      reportUnusedDisableDirectives: "error",
    },
    plugins: { local },
    rules: {
      "local/disable-needs-reason": "error",
      "local/todo-needs-issue": "error",
    },
  },
  {
    // Data fetching lives in shared/lib/ and in a feature's api.ts, server.ts
    // and hooks/. Everything else consumes it. Without this, components grow
    // their own fetches one at a time and the credential and caching decisions
    // in shared/lib/api.ts quietly stop being the only ones.
    files: ["src/app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/*/api.ts", "src/features/*/server.ts", "src/features/*/hooks/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            "Call the API through shared/lib/ or a feature's api.ts, server.ts or hooks/, not directly. They own credentials, caching, and the 401 refresh.",
        },
        ...[
          "MemberExpression[property.name='role']",
          "MemberExpression[computed=true][property.value='role']",
          "ObjectPattern > Property[key.name='role']",
          "ObjectPattern > Property[key.value='role']",
        ].map((selector) => ({
          selector,
          message:
            "Don't decide permissions from a role. Render from the `permissions` the server sent with the resource — see `allows` in @/features/posts (ADR 0004).",
        })),
      ],
    },
  },
  {
    files: [
      "src/**/*.{ts,tsx}",
      "server/src/**/*.{ts,tsx}",
      "server/scripts/**/*.ts",
      "server/tests/**/*.ts",
      "e2e/**/*.ts",
    ],
    rules: { "local/file-name-kebab-case": LAYOUT },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": [LAYOUT, { patterns: [intoFeature] }] },
  },
  {
    files: MARKETING_COPY,
    rules: { "local/no-retired-claims": "error" },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        LAYOUT,
        { patterns: [{ group: ["@/features", "@/features/**"], message: NO_FEATURE_IN_SHARED }] },
      ],
    },
  },
  {
    // Tests are exempt, wherever they sit: seeding a database through a model,
    // or building an Actor directly, is setup rather than coupling.
    files: ["server/src/**/*.{ts,tsx}", "server/scripts/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: { "no-restricted-imports": [LAYOUT, { patterns: [intoModule] }] },
  },
  {
    // Inside a module, a sibling module is `../other/…`; only its index is public.
    files: ["server/src/modules/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        LAYOUT,
        {
          patterns: [
            intoModule,
            { regex: "^\\.\\./[^./][^/]*/(?!index(\\.js)?$)", message: MODULE_ENTRY },
            {
              // Exported for migrations and operator scripts. A module asks the
              // Posts module a question instead of querying its collection.
              regex: "^\\.\\./posts(/index)?(\\.js)?$",
              importNames: ["Post"],
              message:
                "Ask the Posts module through a function on its entry file, not its model (ticket 18).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["server/src/platform/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        LAYOUT,
        { patterns: [{ regex: "(^|/)modules(/|$)", message: NO_MODULE_IN_PLATFORM }] },
      ],
    },
  },
]);

export default eslintConfig;
