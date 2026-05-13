// ─────────────────────────────────────────────
// @skoporama/speech — TTS Interface
// Platform-agnostic text-to-speech abstraction
// ─────────────────────────────────────────────

/** Voice descriptor */
export interface SkoporamaVoice {
  id: string;
  name: string;
  language: string;
  isDefault: boolean;
}

/** TTS configuration options */
export interface TTSOptions {
  /** Speech rate (0.1 to 2.0, default 1.0) */
  rate?: number;
  /** Speech pitch (0.0 to 2.0, default 1.0) */
  pitch?: number;
  /** Voice ID to use */
  voiceId?: string;
  /** Language code (e.g., 'es-ES') */
  language?: string;
  /** Callback when speech finishes */
  onDone?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/** Platform TTS interface — implemented differently for web and native */
export interface ITTSEngine {
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): Promise<boolean>;
  getVoices(): Promise<SkoporamaVoice[]>;
}
