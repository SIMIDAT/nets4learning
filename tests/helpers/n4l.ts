import * as fs from 'fs'
import { vi } from 'vitest'
import type { TFunction } from 'i18next'

import { builtinN4LPackage, n4lPackageByKey } from '@core/n4l/catalog'
import MODEL_N4L from '@pages/playground/0_TabularClassification/models/MODEL_N4L'

// Las direcciones de la aplicación (VITE_PATH + /n4l/…) se sirven desde public/
export const toPublicPath = (url: string) => 'public' + url.replace(import.meta.env.VITE_PATH, '').split('?')[0]

/** fetch que lee de public/ (los paquetes, sus modelos y sus textos) */
export const stubPublicFetch = () => vi.stubGlobal('fetch', async (input: string | URL | Request) => {
  const url = input.toString()
  return new Response(fs.readFileSync(toPublicPath(url)), {
    headers: { 'content-type': url.endsWith('.json') ? 'application/json' : 'application/octet-stream' },
  })
})

export const keyT = ((key: string) => key) as unknown as TFunction<'translation', undefined>

/** El modelo de clasificación tabular de un paquete de public/n4l/, por su clave (IRIS, CAR…) */
export function n4lTabularModel(key: string) {
  const found = n4lPackageByKey('tabular-classification', key)
  if (found === undefined) throw new Error(`No hay paquete tabular-classification con la clave ${key}`)
  return new MODEL_N4L(keyT, () => {}, builtinN4LPackage(found.entry))
}
