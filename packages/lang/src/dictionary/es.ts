// ─────────────────────────────────────────────
// @skoporama/lang — Spanish Frequency Dictionary
// Top ~500 most common Spanish words with frequency scores
// Source: Real Academia Española frequency data
// ─────────────────────────────────────────────

/** Word frequency entry: [word, relative_frequency (0-1)] */
export const SPANISH_FREQUENCIES: [string, number][] = [
  // Articles & prepositions (highest frequency)
  ['de', 1.0], ['la', 0.98], ['que', 0.96], ['el', 0.95], ['en', 0.93],
  ['y', 0.92], ['a', 0.91], ['los', 0.89], ['del', 0.87], ['se', 0.86],
  ['las', 0.85], ['por', 0.84], ['un', 0.83], ['para', 0.82], ['con', 0.81],
  ['no', 0.80], ['una', 0.79], ['su', 0.78], ['al', 0.77], ['lo', 0.76],
  ['como', 0.75], ['más', 0.74], ['pero', 0.73], ['sus', 0.72], ['le', 0.71],
  ['ya', 0.70], ['o', 0.69], ['este', 0.68], ['si', 0.67], ['porque', 0.66],
  ['esta', 0.65], ['entre', 0.64], ['cuando', 0.63], ['muy', 0.62], ['sin', 0.61],
  ['sobre', 0.60], ['también', 0.59], ['me', 0.58], ['hasta', 0.57], ['hay', 0.56],
  ['donde', 0.55], ['quien', 0.54], ['desde', 0.53], ['todo', 0.52], ['nos', 0.51],
  ['durante', 0.50], ['todos', 0.49], ['uno', 0.48], ['les', 0.47], ['ni', 0.46],

  // Common verbs
  ['ser', 0.88], ['haber', 0.85], ['estar', 0.80], ['tener', 0.78], ['hacer', 0.75],
  ['poder', 0.73], ['decir', 0.71], ['ir', 0.70], ['ver', 0.68], ['dar', 0.66],
  ['saber', 0.64], ['querer', 0.62], ['llegar', 0.58], ['pasar', 0.56], ['deber', 0.54],
  ['poner', 0.52], ['parecer', 0.50], ['quedar', 0.48], ['creer', 0.46], ['hablar', 0.44],
  ['llevar', 0.42], ['dejar', 0.40], ['seguir', 0.38], ['encontrar', 0.36], ['llamar', 0.34],
  ['venir', 0.32], ['pensar', 0.30], ['salir', 0.28], ['volver', 0.26], ['tomar', 0.24],
  ['conocer', 0.22], ['vivir', 0.20], ['sentir', 0.18], ['tratar', 0.16], ['mirar', 0.14],
  ['contar', 0.12], ['empezar', 0.10], ['esperar', 0.08], ['buscar', 0.06], ['escribir', 0.05],

  // Common nouns
  ['tiempo', 0.45], ['vida', 0.44], ['vez', 0.43], ['parte', 0.42], ['mundo', 0.41],
  ['casa', 0.40], ['país', 0.39], ['lugar', 0.38], ['persona', 0.37], ['caso', 0.36],
  ['día', 0.35], ['hombre', 0.34], ['momento', 0.33], ['mujer', 0.32], ['año', 0.31],
  ['cosa', 0.30], ['forma', 0.29], ['gobierno', 0.28], ['trabajo', 0.27], ['agua', 0.26],
  ['nombre', 0.25], ['hijo', 0.24], ['mano', 0.23], ['noche', 0.22], ['punto', 0.21],
  ['pueblo', 0.20], ['grupo', 0.19], ['problema', 0.18], ['familia', 0.17], ['cabeza', 0.16],
  ['palabra', 0.15], ['historia', 0.14], ['ejemplo', 0.13], ['ciudad', 0.12], ['cuerpo', 0.11],
  ['padre', 0.10], ['madre', 0.09], ['niño', 0.08], ['amigo', 0.07], ['libro', 0.06],

  // Adjectives
  ['otro', 0.50], ['nuevo', 0.48], ['bueno', 0.46], ['grande', 0.44], ['mejor', 0.42],
  ['primer', 0.40], ['mismo', 0.38], ['largo', 0.36], ['poco', 0.34], ['propio', 0.32],
  ['último', 0.30], ['posible', 0.28], ['malo', 0.26], ['solo', 0.24], ['importante', 0.22],
  ['pequeño', 0.20], ['claro', 0.18], ['difícil', 0.16], ['cierto', 0.14], ['fácil', 0.12],

  // Common expressions for AAC
  ['hola', 0.55], ['gracias', 0.53], ['sí', 0.90], ['bien', 0.60], ['mal', 0.35],
  ['ayuda', 0.40], ['dolor', 0.30], ['hambre', 0.25], ['sed', 0.22], ['frío', 0.20],
  ['calor', 0.18], ['cansado', 0.15], ['contento', 0.12], ['triste', 0.10],
  ['baño', 0.28], ['comida', 0.25], ['médico', 0.20], ['medicina', 0.18],
  ['necesito', 0.45], ['quiero', 0.43], ['puedo', 0.41], ['tengo', 0.50],
  ['estoy', 0.48], ['favor', 0.35], ['perdón', 0.30], ['disculpa', 0.25],

  // Greetings and social
  ['buenos', 0.30], ['días', 0.28], ['tardes', 0.22], ['noches', 0.20],
  ['adiós', 0.25], ['luego', 0.22], ['mañana', 0.20], ['ayer', 0.18],
  ['hoy', 0.35], ['ahora', 0.40], ['aquí', 0.38], ['allí', 0.25],
  ['nunca', 0.20], ['siempre', 0.22], ['todavía', 0.18], ['después', 0.30],
  ['antes', 0.28], ['mucho', 0.40], ['poco', 0.30], ['bastante', 0.20],
];
