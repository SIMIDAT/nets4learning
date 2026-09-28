type MediaPipeSolution_t = { setOptions: (options: { selfieMode: boolean }) => void }

type MediaPipeDetector_t = {
  selfieMode?          : boolean
  handsSolution?       : MediaPipeSolution_t
  faceMeshSolution?    : MediaPipeSolution_t
  faceDetectorSolution?: MediaPipeSolution_t
}

/** Modo espejo aplicado de verdad a la solución de cada detector (al crearse, siempre sin espejo). */
const appliedMirror = new WeakMap<object, boolean>()

/**
 * Fija el modo espejo (`selfieMode`) de un detector de MediaPipe antes de predecir.
 *
 * Los detectores con `runtime: 'mediapipe'` de `@tensorflow-models` (manos, caras, malla facial)
 * solo actualizan `selfieMode` cuando `flipHorizontal` es `true`: tras usar la webcam en espejo,
 * `flipHorizontal: false` se ignoraba y las imágenes subidas se procesaban reflejadas (el dibujo
 * salía al revés). `reset()` tampoco lo desactiva. Aquí se aplica el modo pedido en la solución
 * interna y se sincroniza el campo del detector para que su propia comprobación no haga nada.
 */
export function syncMediaPipeMirror(detector: unknown, flipHorizontal: boolean): void {
  if (detector === null || typeof detector !== 'object') return
  const d = detector as MediaPipeDetector_t
  const solution = d.handsSolution ?? d.faceMeshSolution ?? d.faceDetectorSolution
  if (!solution) return
  if ((appliedMirror.get(d) ?? false) !== flipHorizontal) {
    solution.setOptions({ selfieMode: flipHorizontal })
    appliedMirror.set(d, flipHorizontal)
  }
  d.selfieMode = flipHorizontal
}
