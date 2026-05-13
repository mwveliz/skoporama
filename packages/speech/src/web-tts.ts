// ─────────────────────────────────────────────
// @skoporama/speech — Web TTS Engine
// Uses the Web Speech API (window.speechSynthesis)
// ─────────────────────────────────────────────

import type { ITTSEngine, TTSOptions, SkoporamaVoice } from './types';

export class WebTTSEngine implements ITTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synth) {
      options.onError?.('Speech synthesis not supported in this browser');
      return;
    }

    // Stop any current speech
    this.stop();

    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.language ?? 'es-ES';

      if (options.voiceId) {
        const voices = this.synth!.getVoices();
        const voice = voices.find((v) => v.voiceURI === options.voiceId);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onDone?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        const errorMsg = event.error || 'Speech synthesis error';
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
      };

      this.currentUtterance = utterance;
      this.synth!.speak(utterance);
    });
  }

  stop(): void {
    this.synth?.cancel();
    this.currentUtterance = null;
  }

  pause(): void {
    this.synth?.pause();
  }

  resume(): void {
    this.synth?.resume();
  }

  async isSpeaking(): Promise<boolean> {
    return this.synth?.speaking ?? false;
  }

  async getVoices(): Promise<SkoporamaVoice[]> {
    if (!this.synth) return [];

    // Voices may not be available immediately
    return new Promise((resolve) => {
      const tryGetVoices = () => {
        const voices = this.synth!.getVoices();
        if (voices.length > 0) {
          resolve(
            voices.map((v) => ({
              id: v.voiceURI,
              name: v.name,
              language: v.lang,
              isDefault: v.default,
            }))
          );
        } else {
          // Wait for voices to load
          this.synth!.addEventListener('voiceschanged', () => {
            const voices = this.synth!.getVoices();
            resolve(
              voices.map((v) => ({
                id: v.voiceURI,
                name: v.name,
                language: v.lang,
                isDefault: v.default,
              }))
            );
          }, { once: true });
        }
      };
      tryGetVoices();
    });
  }
}
