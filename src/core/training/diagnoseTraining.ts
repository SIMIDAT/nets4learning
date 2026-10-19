// Qué ha pasado en un entrenamiento, a partir de su historial (la pérdida de cada época con los datos de entrenamiento y,
// si los hay, con los de prueba), para decirlo en palabras y sugerir qué probar. Los umbrales son orientativos: buscan
// los casos claros, no sustituyen mirar las gráficas.

export type DiagnosisKind_t = 'diverged' | 'worse' | 'unstable' | 'not-learning' | 'overfitting' | 'still-improving' | 'good'

export type Diagnosis_t = {
  kind    : DiagnosisKind_t
  severity: 'danger' | 'warning' | 'info' | 'success'
  /** Números para el texto: pérdidas al principio y al final, época del mínimo… */
  values  : Record<string, number>
}

/** Por debajo de esta bajada relativa de la pérdida, la red no ha aprendido casi nada */
const MIN_IMPROVEMENT = 0.05
/** La pérdida de prueba tiene que subir al menos esto desde su mínimo para hablar de sobreajuste */
const OVERFIT_RISE = 0.1
/** La parte final del entrenamiento que se mira para saber si seguía mejorando, y cuánto tendría que haber bajado */
const TAIL = 0.2
const STILL_IMPROVING = 0.03
/** Con menos épocas no se puede decir gran cosa */
const MIN_EPOCHS = 3
/**
 * Inestable: en la segunda mitad, la pérdida cambia de sentido en al menos la mitad de las épocas y cada vez cambia, de
 * media, más de un 30 % (con pocos datos de prueba o una tasa de aprendizaje alta, va a saltos)
 */
const UNSTABLE_TURNS = 0.5
const UNSTABLE_CHANGE = 0.3
const MIN_EPOCHS_UNSTABLE = 6

const isBroken = (value: number) => !Number.isFinite(value)

/** Media móvil de 3 épocas (en los extremos, de las que hay): un salto suelto no decide el diagnóstico */
const smooth = (values: number[]) => values.map((_value, index) => {
  const window = values.slice(Math.max(0, index - 1), index + 2)
  return window.reduce((total, value) => total + value, 0) / window.length
})

/** Si una serie va a saltos en su segunda mitad (ver UNSTABLE_TURNS y UNSTABLE_CHANGE) */
function isUnstable(values: number[]): boolean {
  if (values.length < MIN_EPOCHS_UNSTABLE) return false
  const half = values.slice(Math.floor(values.length / 2) - 1)
  const changes = half.slice(1).map((value, index) => value - half[index])
  const turns = changes.slice(1).filter((change, index) => change * changes[index] < 0).length
  const reference = smooth(half)
  const relative = changes.reduce((total, change, index) => total + Math.abs(change) / Math.max(reference[index + 1], Number.EPSILON), 0) / changes.length
  return turns / (changes.length - 1) >= UNSTABLE_TURNS && relative > UNSTABLE_CHANGE
}

/** El diagnóstico de un entrenamiento: lo más importante primero (como mucho, dos cosas) */
export function diagnoseTraining(history: Record<string, number[]>): Diagnosis_t[] {
  const loss = history.loss ?? []
  const validation = history.val_loss ?? []
  if (loss.length === 0) return []
  if (loss.some(isBroken) || validation.some(isBroken)) {
    const epoch = Math.max(0, loss.findIndex(isBroken)) + 1
    return [{ kind: 'diverged', severity: 'danger', values: { epoch } }]
  }
  const first = loss[0]
  const last = loss.at(-1)!
  if (loss.length < MIN_EPOCHS) return [{ kind: 'still-improving', severity: 'info', values: { first, last, epochs: loss.length } }]

  const findings: Diagnosis_t[] = []
  const improvement = first > 0 ? (first - last) / first : 0
  // Ha subido: los pasos son tan grandes que se pasa de largo (tasa de aprendizaje demasiado alta)
  if (improvement < -MIN_IMPROVEMENT / 2) findings.push({ kind: 'worse', severity: 'warning', values: { first, last } })
  else if (improvement < MIN_IMPROVEMENT) findings.push({ kind: 'not-learning', severity: 'warning', values: { first, last } })

  // La que se mira: la de prueba si la hay
  const hasValidation = validation.length === loss.length
  const series = hasValidation ? validation : loss

  // Inestable: va a saltos, y entonces ni el sobreajuste ni si seguía mejorando se pueden decir con un valor suelto
  const unstable = !findings.some(({ kind }) => kind === 'worse') && isUnstable(series)
  if (unstable) {
    const secondHalf = series.slice(Math.floor(series.length / 2))
    findings.push({ kind: 'unstable', severity: 'warning', values: { min: Math.min(...secondHalf), max: Math.max(...secondHalf) } })
  }

  // Sobreajuste: la de prueba (suavizada) llegó a su mínimo antes del final y ha vuelto a subir, mientras la de
  // entrenamiento seguía bajando
  if (hasValidation && !unstable) {
    const smoothValidation = smooth(validation)
    const smoothLoss = smooth(loss)
    const best = smoothValidation.indexOf(Math.min(...smoothValidation))
    const lastValidation = smoothValidation.at(-1)!
    if (best < validation.length - 1 && lastValidation > smoothValidation[best] * (1 + OVERFIT_RISE) && smoothLoss.at(-1)! < smoothLoss[best]) {
      findings.push({ kind: 'overfitting', severity: 'warning', values: { epoch: best + 1, min: validation[best], last: validation.at(-1)! } })
    }
  }

  // Seguía mejorando: en la parte final, la pérdida (suavizada) ha bajado todavía bastante
  if (!unstable && !findings.some(({ kind }) => kind === 'overfitting' || kind === 'not-learning' || kind === 'worse')) {
    const smoothSeries = smooth(series)
    const start = smoothSeries[Math.max(0, Math.floor(series.length * (1 - TAIL)) - 1)]
    const end = smoothSeries.at(-1)!
    if (start > 0 && (start - end) / start > STILL_IMPROVING) findings.push({ kind: 'still-improving', severity: 'info', values: { first, last, epochs: loss.length } })
  }

  if (findings.length === 0) {
    findings.push({ kind: 'good', severity: 'success', values: { first, last, validation: validation.at(-1) ?? last } })
  }
  return findings.slice(0, 2)
}
