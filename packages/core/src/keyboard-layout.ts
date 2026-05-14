// ─────────────────────────────────────────────
// @skoporama/core — Keyboard Layout
// ─────────────────────────────────────────────

import type { KeyDefinition } from './types';

/** Standard QWERTY layout optimized for gaze typing */
export const QWERTY_LAYOUT: KeyDefinition[][] = [
  // Row 1: Q-P
  [
    { id: 'q', label: 'Q', value: 'q', row: 0, col: 0, type: 'letter' },
    { id: 'w', label: 'W', value: 'w', row: 0, col: 1, type: 'letter' },
    { id: 'e', label: 'E', value: 'e', row: 0, col: 2, type: 'letter' },
    { id: 'r', label: 'R', value: 'r', row: 0, col: 3, type: 'letter' },
    { id: 't', label: 'T', value: 't', row: 0, col: 4, type: 'letter' },
    { id: 'y', label: 'Y', value: 'y', row: 0, col: 5, type: 'letter' },
    { id: 'u', label: 'U', value: 'u', row: 0, col: 6, type: 'letter' },
    { id: 'i', label: 'I', value: 'i', row: 0, col: 7, type: 'letter' },
    { id: 'o', label: 'O', value: 'o', row: 0, col: 8, type: 'letter' },
    { id: 'p', label: 'P', value: 'p', row: 0, col: 9, type: 'letter' },
  ],
  // Row 2: A-Ñ
  [
    { id: 'a', label: 'A', value: 'a', row: 1, col: 0, type: 'letter' },
    { id: 's', label: 'S', value: 's', row: 1, col: 1, type: 'letter' },
    { id: 'd', label: 'D', value: 'd', row: 1, col: 2, type: 'letter' },
    { id: 'f', label: 'F', value: 'f', row: 1, col: 3, type: 'letter' },
    { id: 'g', label: 'G', value: 'g', row: 1, col: 4, type: 'letter' },
    { id: 'h', label: 'H', value: 'h', row: 1, col: 5, type: 'letter' },
    { id: 'j', label: 'J', value: 'j', row: 1, col: 6, type: 'letter' },
    { id: 'k', label: 'K', value: 'k', row: 1, col: 7, type: 'letter' },
    { id: 'l', label: 'L', value: 'l', row: 1, col: 8, type: 'letter' },
    { id: 'ñ', label: 'Ñ', value: 'ñ', row: 1, col: 9, type: 'letter' },
  ],
  // Row 3: Z-M + backspace
  [
    { id: 'z', label: 'Z', value: 'z', row: 2, col: 0, type: 'letter' },
    { id: 'x', label: 'X', value: 'x', row: 2, col: 1, type: 'letter' },
    { id: 'c', label: 'C', value: 'c', row: 2, col: 2, type: 'letter' },
    { id: 'v', label: 'V', value: 'v', row: 2, col: 3, type: 'letter' },
    { id: 'b', label: 'B', value: 'b', row: 2, col: 4, type: 'letter' },
    { id: 'n', label: 'N', value: 'n', row: 2, col: 5, type: 'letter' },
    { id: 'm', label: 'M', value: 'm', row: 2, col: 6, type: 'letter' },
    { id: 'backspace', label: '⌫', value: 'backspace', row: 2, col: 7, width: 2, type: 'backspace' },
  ],
  // Row 4: Action bar
  [
    { id: 'speak', label: '🔊 HABLAR', value: 'speak', row: 3, col: 0, width: 2.5, type: 'speak' },
    { id: 'space', label: '⎵', value: ' ', row: 3, col: 1, width: 5, type: 'space' },
    { id: 'phrases', label: '💬 FRASES', value: 'phrases', row: 3, col: 2, width: 2.5, type: 'phrases' },
  ],
];

/** 
 * Hierarchical layout optimized for low-precision gaze tracking (2-step selection)
 * Level 1: Groups (e.g. A-E)
 * Level 2: Individual letters
 */
export const HIERARCHICAL_LAYOUT = {
  main: [
    // Row 1 (The only row)
    [
      { id: 'group_1', label: 'A B C D E', value: 'group_1', row: 0, col: 0, type: 'group' as const },
      { id: 'group_2', label: 'F G H I J', value: 'group_2', row: 0, col: 1, type: 'group' as const },
      { id: 'group_3', label: 'K L M N Ñ O', value: 'group_3', row: 0, col: 2, type: 'group' as const },
      { id: 'group_4', label: 'P Q R S T', value: 'group_4', row: 0, col: 3, type: 'group' as const },
      { id: 'group_5', label: 'U V W X Y Z', value: 'group_5', row: 0, col: 4, type: 'group' as const },
      { id: 'group_actions', label: '⚙️ ACCIONES', value: 'group_actions', row: 0, col: 5, type: 'group' as const },
    ]
  ],
  groups: {
    group_1: [
      [
        { id: 'a', label: 'A', value: 'a', row: 0, col: 0, type: 'letter' as const },
        { id: 'b', label: 'B', value: 'b', row: 0, col: 1, type: 'letter' as const },
        { id: 'c', label: 'C', value: 'c', row: 0, col: 2, type: 'letter' as const },
        { id: 'd', label: 'D', value: 'd', row: 0, col: 3, type: 'letter' as const },
        { id: 'e', label: 'E', value: 'e', row: 0, col: 4, type: 'letter' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 5, type: 'back' as const },
      ]
    ],
    group_2: [
      [
        { id: 'f', label: 'F', value: 'f', row: 0, col: 0, type: 'letter' as const },
        { id: 'g', label: 'G', value: 'g', row: 0, col: 1, type: 'letter' as const },
        { id: 'h', label: 'H', value: 'h', row: 0, col: 2, type: 'letter' as const },
        { id: 'i', label: 'I', value: 'i', row: 0, col: 3, type: 'letter' as const },
        { id: 'j', label: 'J', value: 'j', row: 0, col: 4, type: 'letter' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 5, type: 'back' as const },
      ]
    ],
    group_3: [
      [
        { id: 'k', label: 'K', value: 'k', row: 0, col: 0, type: 'letter' as const },
        { id: 'l', label: 'L', value: 'l', row: 0, col: 1, type: 'letter' as const },
        { id: 'm', label: 'M', value: 'm', row: 0, col: 2, type: 'letter' as const },
        { id: 'n', label: 'N', value: 'n', row: 0, col: 3, type: 'letter' as const },
        { id: 'ñ', label: 'Ñ', value: 'ñ', row: 0, col: 4, type: 'letter' as const },
        { id: 'o', label: 'O', value: 'o', row: 0, col: 5, type: 'letter' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 6, type: 'back' as const },
      ]
    ],
    group_4: [
      [
        { id: 'p', label: 'P', value: 'p', row: 0, col: 0, type: 'letter' as const },
        { id: 'q', label: 'Q', value: 'q', row: 0, col: 1, type: 'letter' as const },
        { id: 'r', label: 'R', value: 'r', row: 0, col: 2, type: 'letter' as const },
        { id: 's', label: 'S', value: 's', row: 0, col: 3, type: 'letter' as const },
        { id: 't', label: 'T', value: 't', row: 0, col: 4, type: 'letter' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 5, type: 'back' as const },
      ]
    ],
    group_5: [
      [
        { id: 'u', label: 'U', value: 'u', row: 0, col: 0, type: 'letter' as const },
        { id: 'v', label: 'V', value: 'v', row: 0, col: 1, type: 'letter' as const },
        { id: 'w', label: 'W', value: 'w', row: 0, col: 2, type: 'letter' as const },
        { id: 'x', label: 'X', value: 'x', row: 0, col: 3, type: 'letter' as const },
        { id: 'y', label: 'Y', value: 'y', row: 0, col: 4, type: 'letter' as const },
        { id: 'z', label: 'Z', value: 'z', row: 0, col: 5, type: 'letter' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 6, type: 'back' as const },
      ]
    ],
    group_actions: [
      [
        { id: 'space', label: '⎵ ESPACIO', value: ' ', row: 0, col: 0, width: 1, type: 'space' as const },
        { id: 'backspace', label: '⌫ BORRAR', value: 'backspace', row: 0, col: 1, width: 2, type: 'backspace' as const },
        { id: 'speak', label: '🔊 HABLAR', value: 'speak', row: 0, col: 2, type: 'speak' as const },
        { id: 'phrases', label: '💬 FRASES', value: 'phrases', row: 0, col: 3, type: 'phrases' as const },
        { id: 'back', label: '🔙 VOLVER', value: 'back', row: 0, col: 4, type: 'back' as const },
      ]
    ]
  }
};

/**
 * Ouija / iPod Wheel layout: a single continuous strip of keys.
 * A-Z, Space, Backspace, Speak, Phrases
 */
const OUIJA_ALPHABET = 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z'.split(' ');

export const OUIJA_LAYOUT: KeyDefinition[] = [
  ...OUIJA_ALPHABET.map((char, i) => ({
    id: char.toLowerCase(),
    label: char,
    value: char.toLowerCase(),
    row: 0,
    col: i,
    type: 'letter' as const
  })),
  { id: 'space', label: '⎵ ESPACIO', value: ' ', row: 0, col: OUIJA_ALPHABET.length, type: 'space' as const },
  { id: 'backspace', label: '⌫ BORRAR', value: 'backspace', row: 0, col: OUIJA_ALPHABET.length + 1, type: 'backspace' as const },
  { id: 'speak', label: '🔊 HABLAR', value: 'speak', row: 0, col: OUIJA_ALPHABET.length + 2, type: 'speak' as const },
  { id: 'phrases', label: '💬 FRASES', value: 'phrases', row: 0, col: OUIJA_ALPHABET.length + 3, type: 'phrases' as const },
];
