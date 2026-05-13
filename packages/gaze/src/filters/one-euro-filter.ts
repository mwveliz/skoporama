// ─────────────────────────────────────────────
// @skoporama/gaze — One Euro Filter
// Jitter reduction filter for gaze coordinates
// Reference: http://cristal.univ-lille.fr/~casiez/1euro/
// ─────────────────────────────────────────────

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  lowpass(x: number, alpha: number): number {
    if (this.y === null) {
      this.y = x;
      this.s = x;
    } else {
      this.s = alpha * x + (1 - alpha) * (this.s ?? x);
      this.y = this.s;
    }
    return this.y;
  }

  lastValue(): number {
    return this.y ?? 0;
  }

  hasLastValue(): boolean {
    return this.y !== null;
  }
}

export interface OneEuroFilterOptions {
  /** Minimum cutoff frequency (default: 1.0) — lower = more smoothing */
  minCutoff?: number;
  /** Speed coefficient (default: 0.007) — higher = less lag when moving fast */
  beta?: number;
  /** Derivative cutoff frequency (default: 1.0) */
  dCutoff?: number;
}

export class OneEuroFilter {
  private freq: number;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(
    freq: number = 60,
    options: OneEuroFilterOptions = {}
  ) {
    this.freq = freq;
    this.minCutoff = options.minCutoff ?? 1.0;
    this.beta = options.beta ?? 0.007;
    this.dCutoff = options.dCutoff ?? 1.0;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(x: number, timestamp?: number): number {
    if (this.lastTime !== null && timestamp !== undefined) {
      this.freq = 1.0 / (timestamp - this.lastTime);
    }
    this.lastTime = timestamp ?? (this.lastTime ?? 0) + 1 / this.freq;

    const prevX = this.xFilter.hasLastValue() ? this.xFilter.lastValue() : x;
    const dx = (x - prevX) * this.freq;
    const edx = this.dxFilter.lowpass(dx, this.alpha(this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.lowpass(x, this.alpha(cutoff));
  }

  reset(): void {
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
    this.lastTime = null;
  }
}

/** Pair of One Euro Filters for 2D gaze coordinates */
export class GazeFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(freq: number = 60, options: OneEuroFilterOptions = {}) {
    this.xFilter = new OneEuroFilter(freq, options);
    this.yFilter = new OneEuroFilter(freq, options);
  }

  filter(x: number, y: number, timestamp?: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, timestamp),
      y: this.yFilter.filter(y, timestamp),
    };
  }

  reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}
