/**
 * Prepares the stylesheet inputs design-sync ships.
 *
 * Vision is a Next.js app, not a published package, so there is no `dist/`
 * stylesheet. The faithful source is the CSS Next itself compiles — it already
 * contains the token layer, every utility the components actually use, and the
 * next/font @font-face rules. This script harvests that build output and
 * rewrites it into two files the converter can consume:
 *
 *   .cache/vision-compiled.css  — everything except @font-face
 *   .cache/fonts/fonts.css      — the @font-face rules, with url()s rewritten
 *                                 to sit beside the copied .woff2 files
 *
 * Run `bun run build` first — this reads .next/static/.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from "node:fs";
import { join, basename } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const chunks = join(root, ".next/static/chunks");
const media = join(root, ".next/static/media");
const cacheDir = join(root, ".design-sync/.cache");
const fontsDir = join(cacheDir, "fonts");

const cssFiles = readdirSync(chunks).filter((f) => f.endsWith(".css")).sort();
if (!cssFiles.length) {
  console.error("no CSS in .next/static/chunks — run `bun run build` first");
  process.exit(1);
}

const combined = cssFiles.map((f) => readFileSync(join(chunks, f), "utf8")).join("\n");

// Only @font-face rules that reference a file move out with the fonts.
// next/font also emits metric-override faces backed by `local(Arial)`; those
// ship no file, so they stay in the stylesheet — pulled out, the converter
// drops them and the shipped CSS references families nothing defines.
const faceRe = /@font-face\{[^}]*\}/g;
const faces = (combined.match(faceRe) ?? []).filter((f) => f.includes("url("));
const withoutFaces = combined.replace(faceRe, (m) => (m.includes("url(") ? "" : m));

rmSync(fontsDir, { recursive: true, force: true });
mkdirSync(fontsDir, { recursive: true });

const copied = new Set();
const rewritten = faces.map((face) =>
  face.replace(/url\(([^)]*\/)?([^)/]+\.woff2?)\)/g, (_m, _dir, file) => {
    const src = join(media, file);
    if (!copied.has(file)) {
      copyFileSync(src, join(fontsDir, basename(file)));
      copied.add(file);
    }
    return `url(./${basename(file)})`;
  })
);

mkdirSync(cacheDir, { recursive: true });
writeFileSync(join(cacheDir, "vision-compiled.css"), withoutFaces);
writeFileSync(join(fontsDir, "fonts.css"), rewritten.join("\n") + "\n");

console.log(
  `css: ${cssFiles.length} chunk(s) -> vision-compiled.css (${withoutFaces.length} bytes)\n` +
    `fonts: ${faces.length} @font-face rule(s), ${copied.size} file(s) copied`
);
