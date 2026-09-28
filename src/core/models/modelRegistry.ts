/* eslint-disable @typescript-eslint/no-explicit-any */

/** Constructor de una clase de modelo (cada tarea tiene su propia firma de constructor). */
export type ModelClass<T> = new (...args: any[]) => T

/**
 * Registro de modelos: clave → función que importa (bajo demanda) la clase del modelo.
 * Cada `import()` genera su propio chunk, así que solo se descarga el modelo que se usa.
 */
export type ModelRegistry<T> = Record<string, () => Promise<ModelClass<T>>>

export function hasModel<T>(registry: ModelRegistry<T>, key: string | undefined): key is string {
  return key !== undefined && Object.prototype.hasOwnProperty.call(registry, key)
}

/** Carga la clase del modelo `key`; lanza un error si la clave no está registrada. */
export async function loadModelClass<T>(registry: ModelRegistry<T>, key: string): Promise<ModelClass<T>> {
  if (!hasModel(registry, key)) throw new Error(`Modelo desconocido: ${key}`)
  return registry[key]()
}
