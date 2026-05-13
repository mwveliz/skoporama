// ─────────────────────────────────────────────
// @skoporama/core — Types
// ─────────────────────────────────────────────

/** Represents a 2D screen coordinate */
export interface Point {
  x: number;
  y: number;
}

/** Gaze tracking state */
export type GazeStatus = 'idle' | 'calibrating' | 'tracking' | 'paused' | 'error';

/** Keyboard input modes */
export type InputMode = 'dwell' | 'dwell-free' | 'scanning';

/** Text-to-speech state */
export type SpeechStatus = 'idle' | 'speaking' | 'paused';

/** Supported languages */
export type SupportedLanguage = 'es' | 'en';

/** User settings that persist across sessions */
export interface UserSettings {
  language: SupportedLanguage;
  inputMode: InputMode;
  dwellTimeMs: number;
  speechRate: number;
  speechPitch: number;
  voiceId: string | null;
  darkMode: boolean;
  keySize: 'small' | 'medium' | 'large';
  showGazeIndicator: boolean;
  quickPhrases: string[];
  autoSpeak: boolean;
}

/** A key on the virtual keyboard */
export interface KeyDefinition {
  id: string;
  label: string;
  value: string;
  row: number;
  col: number;
  width?: number;
  type: 'letter' | 'space' | 'backspace' | 'speak' | 'phrases' | 'shift' | 'special' | 'group' | 'back';
}

/** Word prediction result */
export interface Prediction {
  word: string;
  confidence: number;
  source: 'ngram' | 'abbreviation' | 'llm';
}

/** Calibration point data */
export interface CalibrationPoint {
  screenPosition: Point;
  irisFeatures: number[];
  timestamp: number;
}

/** Quick phrase category */
export interface PhraseCategory {
  id: string;
  name: string;
  icon: string;
  phrases: string[];
}

/** Default user settings */
export const DEFAULT_SETTINGS: UserSettings = {
  language: 'es',
  inputMode: 'dwell',
  dwellTimeMs: 600,
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceId: null,
  darkMode: true,
  keySize: 'medium',
  showGazeIndicator: true,
  autoSpeak: false,
  quickPhrases: [
    'Hola',
    'Sí',
    'No',
    'Gracias',
    'Necesito ayuda',
    'Tengo sed',
    'Tengo hambre',
    'Me duele',
    'Estoy bien',
    'Te quiero',
  ],
};

/** Default quick phrase categories */
export const DEFAULT_PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: 'basics',
    name: 'Básico',
    icon: '💬',
    phrases: ['Hola', 'Sí', 'No', 'Gracias', 'Por favor', 'De nada'],
  },
  {
    id: 'needs',
    name: 'Necesidades',
    icon: '🆘',
    phrases: [
      'Necesito ayuda',
      'Tengo sed',
      'Tengo hambre',
      'Necesito ir al baño',
      'Tengo frío',
      'Tengo calor',
    ],
  },
  {
    id: 'feelings',
    name: 'Sentimientos',
    icon: '❤️',
    phrases: [
      'Estoy bien',
      'Me duele',
      'Estoy cansado',
      'Estoy contento',
      'Te quiero',
      'Estoy triste',
    ],
  },
  {
    id: 'social',
    name: 'Social',
    icon: '👋',
    phrases: [
      '¿Cómo estás?',
      'Buenos días',
      'Buenas noches',
      'Hasta luego',
      '¿Qué hora es?',
      'Cuéntame',
    ],
  },
];
