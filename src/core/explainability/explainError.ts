/**
 * Error esperable al explicar (p. ej. "el modelo no ha detectado nada"), con una clave de i18n
 * para mostrarle al usuario un mensaje comprensible en lugar de un error genérico.
 */
export class ExplainError extends Error {
  readonly i18nKey: string

  constructor(i18nKey: string) {
    super(i18nKey)
    this.name = 'ExplainError'
    this.i18nKey = i18nKey
  }
}

/** Clave de i18n del mensaje a mostrar para cualquier error de la explicabilidad. */
export const explainErrorKey = (error: unknown): string =>
  error instanceof ExplainError ? error.i18nKey : 'ui.explain.error'
