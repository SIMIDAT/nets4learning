/** Constructor de una clase de modelo (cada tarea tiene su propia firma de constructor). */
export type ModelClass<T> = new (...args: any[]) => T

/**
 * Registro de modelos: clave → función que importa (bajo demanda) la clase del modelo.
 * Cada `import()` genera su propio chunk, así que solo se descarga el modelo que se usa.
 */
export type ModelRegistry<T> = Record<string, () => Promise<ModelClass<T>>>

/** Las claves que un registro resuelve al pedirlas (p. ej. local-<id>: los paquetes .n4l abiertos por el usuario) */
export type DynamicModels_t<T> = (key: string) => (() => Promise<ModelClass<T>>) | undefined
const DYNAMIC = new WeakMap<object, DynamicModels_t<unknown>>()

/** El registro, que además resuelve al pedirlas las claves que reconozca `resolve` */
export function withDynamicModels<T>(registry: ModelRegistry<T>, resolve: DynamicModels_t<T>): ModelRegistry<T> {
  DYNAMIC.set(registry, resolve as DynamicModels_t<unknown>)
  return registry
}

const loaderOf = <T>(registry: ModelRegistry<T>, key: string) => (Object.prototype.hasOwnProperty.call(registry, key)
  ? registry[key]
  : (DYNAMIC.get(registry) as DynamicModels_t<T> | undefined)?.(key))

export function hasModel<T>(registry: ModelRegistry<T>, key: string | undefined): key is string {
  return key !== undefined && loaderOf(registry, key) !== undefined
}

/** Carga la clase del modelo `key`; lanza un error si la clave no está registrada. */
export async function loadModelClass<T>(registry: ModelRegistry<T>, key: string): Promise<ModelClass<T>> {
  const loader = loaderOf(registry, key)
  if (loader === undefined) throw new Error(`Modelo desconocido: ${key}`)
  return loader()
}
