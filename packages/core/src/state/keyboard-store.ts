// ─────────────────────────────────────────────
// @skoporama/core — Keyboard State Store (Zustand)
// ─────────────────────────────────────────────

import { createStore } from 'zustand/vanilla';
import type {
  GazeStatus,
  InputMode,
  Point,
  Prediction,
  SpeechStatus,
  UserSettings,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

export interface KeyboardState {
  // Text buffer
  text: string;
  cursorPosition: number;

  // Gaze
  gazeStatus: GazeStatus;
  gazePoint: Point | null;
  activeKeyId: string | null;
  dwellProgress: number; // 0..1

  // Predictions
  predictions: Prediction[];

  // Speech
  speechStatus: SpeechStatus;

  // UI
  showPhrases: boolean;
  showSettings: boolean;
  showCalibration: boolean;

  // Settings
  settings: UserSettings;

  // Actions
  appendChar: (char: string) => void;
  deleteChar: () => void;
  clearText: () => void;
  setText: (text: string) => void;
  selectPrediction: (prediction: Prediction) => void;
  selectPhrase: (phrase: string) => void;

  setGazeStatus: (status: GazeStatus) => void;
  setGazePoint: (point: Point | null) => void;
  setActiveKey: (keyId: string | null) => void;
  setDwellProgress: (progress: number) => void;

  setPredictions: (predictions: Prediction[]) => void;
  setSpeechStatus: (status: SpeechStatus) => void;

  togglePhrases: () => void;
  toggleSettings: () => void;
  setShowCalibration: (show: boolean) => void;

  updateSettings: (partial: Partial<UserSettings>) => void;
}

/** Create a vanilla Zustand store (framework-agnostic) */
export const createKeyboardStore = (initialSettings?: Partial<UserSettings>) =>
  createStore<KeyboardState>((set, get) => ({
    // Initial state
    text: '',
    cursorPosition: 0,
    gazeStatus: 'idle',
    gazePoint: null,
    activeKeyId: null,
    dwellProgress: 0,
    predictions: [],
    speechStatus: 'idle',
    showPhrases: false,
    showSettings: false,
    showCalibration: false,
    settings: { ...DEFAULT_SETTINGS, ...initialSettings },

    // Text actions
    appendChar: (char: string) =>
      set((state) => ({
        text: state.text + char,
        cursorPosition: state.text.length + 1,
      })),

    deleteChar: () =>
      set((state) => ({
        text: state.text.slice(0, -1),
        cursorPosition: Math.max(0, state.cursorPosition - 1),
      })),

    clearText: () => set({ text: '', cursorPosition: 0 }),

    setText: (text: string) => set({ text, cursorPosition: text.length }),

    selectPrediction: (prediction: Prediction) =>
      set((state) => {
        // Replace the current partial word with the prediction
        const words = state.text.split(' ');
        words[words.length - 1] = prediction.word;
        const newText = words.join(' ') + ' ';
        return { text: newText, cursorPosition: newText.length, predictions: [] };
      }),

    selectPhrase: (phrase: string) =>
      set((state) => {
        const newText = state.text ? state.text + ' ' + phrase : phrase;
        return {
          text: newText,
          cursorPosition: newText.length,
          showPhrases: false,
        };
      }),

    // Gaze actions
    setGazeStatus: (gazeStatus) => set({ gazeStatus }),
    setGazePoint: (gazePoint) => set({ gazePoint }),
    setActiveKey: (activeKeyId) => set({ activeKeyId }),
    setDwellProgress: (dwellProgress) => set({ dwellProgress }),

    // Prediction actions
    setPredictions: (predictions) => set({ predictions }),

    // Speech actions
    setSpeechStatus: (speechStatus) => set({ speechStatus }),

    // UI toggles
    togglePhrases: () => set((state) => ({ showPhrases: !state.showPhrases })),
    toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
    setShowCalibration: (showCalibration) => set({ showCalibration }),

    // Settings
    updateSettings: (partial) =>
      set((state) => ({
        settings: { ...state.settings, ...partial },
      })),
  }));
