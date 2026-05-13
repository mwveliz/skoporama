// ─────────────────────────────────────────────
// @skoporama/lang — Public API
// ─────────────────────────────────────────────

export { SPANISH_FREQUENCIES } from './dictionary/es';
export {
  predictFromPrefix,
  expandAbbreviation,
  getCurrentWord,
} from './predictor/ngram-predictor';
export type { PredictorOptions } from './predictor/ngram-predictor';
