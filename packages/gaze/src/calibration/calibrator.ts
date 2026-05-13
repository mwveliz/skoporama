// ─────────────────────────────────────────────
// @skoporama/gaze — Calibration System
// Collects gaze data at known screen positions and
// trains a tiny regression model to map iris → screen coords
// ─────────────────────────────────────────────

import type { Point, CalibrationPoint } from '@skoporama/core';
import type { IrisFeatures } from '../mediapipe/iris-tracker';
import { featuresToArray } from '../mediapipe/iris-tracker';

/** Calibration grid configuration */
export interface CalibrationConfig {
  /** Number of columns in the calibration grid */
  cols: number;
  /** Number of rows in the calibration grid */
  rows: number;
  /** Time to spend on each point (ms) */
  dwellTimeMs: number;
  /** Number of feature samples to collect per point */
  samplesPerPoint: number;
  /** Padding from screen edges (fraction 0-0.5) */
  padding: number;
}

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  cols: 6,
  rows: 1,
  dwellTimeMs: 2000,
  samplesPerPoint: 30,
  padding: 0.15,
};

/** Generate calibration target positions for a given screen size */
export function generateCalibrationPoints(
  screenWidth: number,
  screenHeight: number,
  config: CalibrationConfig = DEFAULT_CALIBRATION_CONFIG
): Point[] {
  const points: Point[] = [];
  const padX = screenWidth * config.padding;
  const padY = screenHeight * config.padding;
  
  const usableWidth = screenWidth - 2 * padX;
  const usableHeight = screenHeight - 2 * padY;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      points.push({
        x: padX + (config.cols > 1 ? (col / (config.cols - 1)) * usableWidth : usableWidth / 2),
        y: padY + (config.rows > 1 ? (row / (config.rows - 1)) * usableHeight : usableHeight / 2),
      });
    }
  }

  return points;
}

/**
 * Simple ridge regression model for mapping iris features → screen coordinates.
 * This runs entirely in the browser — no TF.js needed for this simple approach.
 * We can upgrade to a TF.js dense net later if accuracy needs improvement.
 */
export class GazeRegressionModel {
  private weightsX: number[] | null = null;
  private weightsY: number[] | null = null;
  private biasX = 0;
  private biasY = 0;
  private trained = false;

  /** 
   * Train the model from collected calibration data.
   * Uses least squares with ridge regularization.
   */
  train(data: CalibrationPoint[]): void {
    if (data.length < 4) {
      throw new Error('Need at least 4 calibration points to train');
    }

    const n = data.length;
    const featureCount = data[0].irisFeatures.length;

    // Build feature matrix (add bias column)
    const X: number[][] = data.map((d) => [...d.irisFeatures, 1]);
    const yX: number[] = data.map((d) => d.screenPosition.x);
    const yY: number[] = data.map((d) => d.screenPosition.y);

    // Ridge regularization parameter
    const lambda = 0.01;

    // Solve X^T * X * w = X^T * y  (with regularization)
    const solveX = this.ridgeRegression(X, yX, lambda);
    const solveY = this.ridgeRegression(X, yY, lambda);

    this.weightsX = solveX.slice(0, featureCount);
    this.biasX = solveX[featureCount];
    this.weightsY = solveY.slice(0, featureCount);
    this.biasY = solveY[featureCount];
    this.trained = true;
  }

  /** Predict screen position from iris features */
  predict(features: IrisFeatures): Point | null {
    if (!this.trained || !this.weightsX || !this.weightsY) {
      return null;
    }

    const feats = featuresToArray(features);
    let x = this.biasX;
    let y = this.biasY;

    for (let i = 0; i < feats.length; i++) {
      x += feats[i] * this.weightsX[i];
      y += feats[i] * this.weightsY[i];
    }

    return { x, y };
  }

  /** Check if the model has been trained */
  isTrained(): boolean {
    return this.trained;
  }

  /** Export model weights for storage */
  exportWeights(): string | null {
    if (!this.trained) return null;
    return JSON.stringify({
      weightsX: this.weightsX,
      weightsY: this.weightsY,
      biasX: this.biasX,
      biasY: this.biasY,
    });
  }

  /** Import previously saved model weights */
  importWeights(json: string): void {
    const data = JSON.parse(json);
    this.weightsX = data.weightsX;
    this.weightsY = data.weightsY;
    this.biasX = data.biasX;
    this.biasY = data.biasY;
    this.trained = true;
  }

  /**
   * Ridge regression using normal equations:
   * w = (X^T X + λI)^{-1} X^T y
   */
  private ridgeRegression(X: number[][], y: number[], lambda: number): number[] {
    const n = X.length;
    const p = X[0].length;

    // X^T X
    const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        XtX[i][j] = sum + (i === j ? lambda : 0);
      }
    }

    // X^T y
    const Xty: number[] = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
      for (let k = 0; k < n; k++) {
        Xty[i] += X[k][i] * y[k];
      }
    }

    // Solve using Gaussian elimination
    return this.solveLinearSystem(XtX, Xty);
  }

  /** Gaussian elimination with partial pivoting */
  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    // Augmented matrix
    const aug: number[][] = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
      // Partial pivoting
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
          maxRow = row;
        }
      }
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

      // Eliminate below
      for (let row = col + 1; row < n; row++) {
        const factor = aug[row][col] / aug[col][col];
        for (let j = col; j <= n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      x[row] = aug[row][n];
      for (let col = row + 1; col < n; col++) {
        x[row] -= aug[row][col] * x[col];
      }
      x[row] /= aug[row][row];
    }

    return x;
  }
}
