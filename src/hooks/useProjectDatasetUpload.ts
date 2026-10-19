import { useEffect, useEffectEvent, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import type { TASKS_TYPE_V } from '@/TASKS'
import alertHelper from '@utils/alertHelper'
import { fileName, projectDatasetByKey, taskDatasetFiles } from '@pages/analyze/projectDatasets'

/**
 * Un CSV del proyecto pedido en la dirección (?dataset=wine, como en el AED; desde «Entrenar» en /datasets): en la
 * página de subir datos se carga como si se hubiera arrastrado. Solo los ficheros de la lista del proyecto y de esta
 * tarea (los de sus conjuntos y los de práctica); luego se quita de la dirección, para que recargar no lo vuelva a subir.
 */
export function useProjectDatasetUpload(task: TASKS_TYPE_V, enabled: boolean, onFiles: (files: File[]) => void) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const key = searchParams.get('dataset')
  const loaded = useRef<string | null>(null)
  const upload = useEffectEvent(onFiles)
  const showError = useEffectEvent(() => { void alertHelper.alertError(t('error.file-upload')) })

  useEffect(() => {
    if (!enabled || key === null || loaded.current === key) return
    loaded.current = key
    navigate({ search: '' }, { replace: true })
    const dataset = projectDatasetByKey(key)
    if (dataset === undefined || !taskDatasetFiles(task).includes(dataset.file)) return
    // Sin cancelar al desmontar: en modo estricto el efecto se repite y la segunda vez ya no lo carga (loaded)
    fetch(import.meta.env.VITE_PATH + '/' + dataset.file)
      .then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${dataset.file}`)
        const blob = await response.blob()
        upload([new File([blob], fileName(dataset.file), { type: 'text/csv' })])
      })
      .catch((error: unknown) => {
        console.error(error)
        showError()
      })
  }, [enabled, key, task, navigate])
}
