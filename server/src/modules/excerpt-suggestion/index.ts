// The Excerpt Suggestion module's interface (ADR 0007). Everything that can
// reach the text provider is inside this folder, which is what ADR 0002's
// "no AI on the save or publish path" is checked against.
export { suggestExcerpt, type GenerateText } from './suggest-excerpt';
export { resolveGenerateText, excerptSuggestionAvailable } from './provider';
export { recordExcerptSuggestion, claimOrphanSuggestion } from './record';
export {
  computeAdoption,
  computeKeptUnedited,
  formatRate,
  ADOPTION_THRESHOLD,
  KEPT_UNEDITED_THRESHOLD,
} from './metrics';
