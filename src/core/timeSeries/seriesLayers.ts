// Las capas de la red de una serie temporal, sin TF.js: las usan el editor, la comprobación de capas y quien construye
// la red (src/core/training/buildModels.ts)

/** Dense y las recurrentes, que leen la ventana valor a valor */
export const SERIES_LAYER_CLASSES = ['dense', 'simpleRNN', 'lstm', 'gru'] as const
export type SeriesLayerClass_t = typeof SERIES_LAYER_CLASSES[number]

/** Su nombre, el técnico (como el de las activaciones) */
export const SERIES_LAYER_LABELS: Record<SeriesLayerClass_t, string> = { dense: 'Dense', simpleRNN: 'SimpleRNN', lstm: 'LSTM', gru: 'GRU' }

/** Una capa de la red de una serie temporal; `is_disabled`, la salida (una neurona lineal), que no se cambia */
export type SeriesLayer_t = { _class: SeriesLayerClass_t, units: number, activation: string | null, is_disabled?: boolean }

export const isRecurrentLayer = ({ _class }: Pick<SeriesLayer_t, '_class'>) => _class !== 'dense'

/** La salida de la red: una neurona lineal, el valor que se predice */
export const SERIES_OUTPUT_LAYER: SeriesLayer_t = { _class: 'dense', units: 1, activation: 'linear', is_disabled: true }
