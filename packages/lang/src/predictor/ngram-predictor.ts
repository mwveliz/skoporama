// ─────────────────────────────────────────────
// @skoporama/lang — N-gram Text Predictor
// Predicts next words based on typed prefix and context
// ─────────────────────────────────────────────

import type { Prediction, SupportedLanguage } from '@skoporama/core';
import { SPANISH_FREQUENCIES } from '../dictionary/es';

/** Build a frequency map from word list */
function buildFrequencyMap(entries: [string, number][]): Map<string, number> {
  const map = new Map<string, number>();
  for (const [word, freq] of entries) {
    // Keep highest frequency if duplicates exist
    const existing = map.get(word);
    if (existing === undefined || freq > existing) {
      map.set(word, freq);
    }
  }
  return map;
}

const FREQUENCY_MAPS: Record<SupportedLanguage, Map<string, number>> = {
  es: buildFrequencyMap(SPANISH_FREQUENCIES),
  en: new Map(), // TODO: Add English dictionary
};

export interface PredictorOptions {
  /** Maximum number of predictions to return */
  maxResults?: number;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Language to use for prediction */
  language?: SupportedLanguage;
}

/**
 * Predict words based on the current prefix.
 * Uses frequency-weighted prefix matching.
 */
export function predictFromPrefix(
  prefix: string,
  options: PredictorOptions = {}
): Prediction[] {
  const {
    maxResults = 5,
    minConfidence = 0.01,
    language = 'es',
  } = options;

  if (!prefix || prefix.length === 0) return [];

  const lowerPrefix = prefix.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const freqMap = FREQUENCY_MAPS[language];

  const matches: Prediction[] = [];

  for (const [word, freq] of freqMap) {
    const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedWord.startsWith(lowerPrefix) && normalizedWord !== lowerPrefix) {
      matches.push({
        word,
        confidence: freq * (prefix.length / word.length), // Boost longer prefix matches
        source: 'ngram',
      });
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches
    .filter((m) => m.confidence >= minConfidence)
    .slice(0, maxResults);
}

/**
 * Predict complete phrases from abbreviations (initial letters).
 * E.g., "hce" → "hola, ¿cómo estás?"
 */
export function expandAbbreviation(
  abbreviation: string,
  options: PredictorOptions = {}
): Prediction[] {
  const {
    maxResults = 3,
    language = 'es',
  } = options;

  if (!abbreviation || abbreviation.length < 2) return [];

  const freqMap = FREQUENCY_MAPS[language];
  const letters = abbreviation.toLowerCase().split('');

  // For each letter in the abbreviation, find top matching words
  const wordCandidates: string[][] = letters.map((letter) => {
    const candidates: [string, number][] = [];
    for (const [word, freq] of freqMap) {
      const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedWord.startsWith(letter)) {
        candidates.push([word, freq]);
      }
    }
    candidates.sort((a, b) => b[1] - a[1]);
    return candidates.slice(0, 5).map(([w]) => w);
  });

  // Generate top combinations (greedy approach)
  const results: Prediction[] = [];
  const maxCombinations = Math.min(maxResults * 2, 10);

  // Simple greedy: take top word for each letter position
  if (wordCandidates.every((c) => c.length > 0)) {
    const phrase = wordCandidates.map((candidates) => candidates[0]).join(' ');
    const avgFreq = wordCandidates.reduce((sum, candidates) => {
      const word = candidates[0];
      return sum + (freqMap.get(word) ?? 0);
    }, 0) / wordCandidates.length;

    results.push({
      word: phrase,
      confidence: avgFreq * 0.8,
      source: 'abbreviation',
    });

    // Generate a few more variations
    for (let i = 0; i < Math.min(wordCandidates.length, maxCombinations - 1); i++) {
      if (wordCandidates[i].length > 1) {
        const variant = wordCandidates.map((candidates, j) =>
          j === i && candidates.length > 1 ? candidates[1] : candidates[0]
        ).join(' ');

        if (variant !== phrase) {
          results.push({
            word: variant,
            confidence: avgFreq * 0.5,
            source: 'abbreviation',
          });
        }
      }
    }
  }

  return results.slice(0, maxResults);
}

/**
 * Get the current word being typed from a text buffer.
 * Returns the partial word after the last space.
 */
export function getCurrentWord(text: string): string {
  const trimmed = text.trimEnd();
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace === -1 ? trimmed : trimmed.substring(lastSpace + 1);
}
