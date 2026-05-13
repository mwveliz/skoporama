// ─────────────────────────────────────────────
// @skoporama/gaze — Public API
// ─────────────────────────────────────────────

export { OneEuroFilter, GazeFilter } from './filters/one-euro-filter';
export type { OneEuroFilterOptions } from './filters/one-euro-filter';

export { extractIrisFeatures, featuresToArray } from './mediapipe/iris-tracker';
export type { IrisFeatures, Landmark } from './mediapipe/iris-tracker';

export {
  GazeRegressionModel,
  generateCalibrationPoints,
  DEFAULT_CALIBRATION_CONFIG,
} from './calibration/calibrator';
export type { CalibrationConfig } from './calibration/calibrator';
