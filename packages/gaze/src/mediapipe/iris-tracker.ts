// ─────────────────────────────────────────────
// @skoporama/gaze — Iris Tracker
// Extracts iris position features from MediaPipe Face Mesh landmarks
// ─────────────────────────────────────────────

import type { Point } from '@skoporama/core';

/**
 * MediaPipe Face Mesh iris landmark indices (refineLandmarks: true required)
 * Left eye iris: 468-472 (center = 468)
 * Right eye iris: 473-477 (center = 473)
 * 
 * Left eye corners: 33 (inner), 133 (outer)
 * Right eye corners: 362 (inner), 263 (outer)
 * 
 * Left eyelids: 159 (top), 145 (bottom)
 * Right eyelids: 386 (top), 374 (bottom)
 */
const LANDMARKS = {
  leftIrisCenter: 468,
  rightIrisCenter: 473,
  leftEyeInner: 33,
  leftEyeOuter: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftEyelidTop: 159,
  leftEyelidBottom: 145,
  rightEyelidTop: 386,
  rightEyelidBottom: 374,
} as const;

/** Raw landmark point from MediaPipe */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** Features extracted from iris position relative to eye bounds */
export interface IrisFeatures {
  /** Left iris horizontal ratio (0=inner, 1=outer) */
  leftIrisX: number;
  /** Left iris vertical ratio (0=top, 1=bottom) */
  leftIrisY: number;
  /** Right iris horizontal ratio (0=inner, 1=outer) */
  rightIrisX: number;
  /** Right iris vertical ratio (0=top, 1=bottom) */
  rightIrisY: number;
  /** Average iris X (mean of left and right) */
  avgIrisX: number;
  /** Average iris Y (mean of left and right) */
  avgIrisY: number;
  /** Head pose roll approximation from eye positions */
  headRoll: number;
  /** Left eye openness ratio */
  leftEyeOpenness: number;
  /** Right eye openness ratio */
  rightEyeOpenness: number;
  /** Whether the user appears to be blinking */
  isBlinking: boolean;
}

/**
 * Calculate the ratio of a point between two bounds.
 * Returns 0 when at start, 1 when at end, values outside [0,1] when out of bounds.
 */
function ratio(value: number, start: number, end: number): number {
  const range = end - start;
  if (Math.abs(range) < 1e-6) return 0.5;
  return (value - start) / range;
}

/** Distance between two landmarks */
function distance(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const BLINK_THRESHOLD = 0.15;

/**
 * Extract iris features from MediaPipe Face Mesh landmarks.
 * These features are the input to the gaze regression model.
 */
export function extractIrisFeatures(landmarks: Landmark[]): IrisFeatures | null {
  if (landmarks.length < 478) {
    // Need iris landmarks (478 total with refinement)
    return null;
  }

  const leftIris = landmarks[LANDMARKS.leftIrisCenter];
  const rightIris = landmarks[LANDMARKS.rightIrisCenter];
  const leftInner = landmarks[LANDMARKS.leftEyeInner];
  const leftOuter = landmarks[LANDMARKS.leftEyeOuter];
  const rightInner = landmarks[LANDMARKS.rightEyeInner];
  const rightOuter = landmarks[LANDMARKS.rightEyeOuter];
  const leftTop = landmarks[LANDMARKS.leftEyelidTop];
  const leftBottom = landmarks[LANDMARKS.leftEyelidBottom];
  const rightTop = landmarks[LANDMARKS.rightEyelidTop];
  const rightBottom = landmarks[LANDMARKS.rightEyelidBottom];

  // Horizontal iris position relative to eye corners
  const leftIrisX = ratio(leftIris.x, leftInner.x, leftOuter.x);
  const rightIrisX = ratio(rightIris.x, rightOuter.x, rightInner.x);

  // Vertical iris position relative to eyelids
  const leftIrisY = ratio(leftIris.y, leftTop.y, leftBottom.y);
  const rightIrisY = ratio(rightIris.y, rightTop.y, rightBottom.y);

  // Average both eyes for stability
  const avgIrisX = (leftIrisX + rightIrisX) / 2;
  const avgIrisY = (leftIrisY + rightIrisY) / 2;

  // Head roll estimation from eye height difference
  const headRoll = Math.atan2(
    rightInner.y - leftInner.y,
    rightInner.x - leftInner.x
  );

  // Eye openness (EAR - Eye Aspect Ratio)
  const leftEyeWidth = distance(leftInner, leftOuter);
  const leftEyeHeight = distance(leftTop, leftBottom);
  const leftEyeOpenness = leftEyeWidth > 0 ? leftEyeHeight / leftEyeWidth : 0;

  const rightEyeWidth = distance(rightInner, rightOuter);
  const rightEyeHeight = distance(rightTop, rightBottom);
  const rightEyeOpenness = rightEyeWidth > 0 ? rightEyeHeight / rightEyeWidth : 0;

  const isBlinking = leftEyeOpenness < BLINK_THRESHOLD && rightEyeOpenness < BLINK_THRESHOLD;

  return {
    leftIrisX,
    leftIrisY,
    rightIrisX,
    rightIrisY,
    avgIrisX,
    avgIrisY,
    headRoll,
    leftEyeOpenness,
    rightEyeOpenness,
    isBlinking,
  };
}

/**
 * Convert iris features to a flat array for ML model input.
 * Order: [avgX, avgY, leftX, leftY, rightX, rightY, headRoll]
 */
export function featuresToArray(features: IrisFeatures): number[] {
  return [
    features.avgIrisX,
    features.avgIrisY,
    features.leftIrisX,
    features.leftIrisY,
    features.rightIrisX,
    features.rightIrisY,
    features.headRoll,
  ];
}
