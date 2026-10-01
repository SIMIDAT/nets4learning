import { useEffect } from 'react'
import { Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'

// Id del contenedor del visor en tfjs-vis
const VISOR_CONTAINER_ID = 'tfjs-visor-container'

// tfvis.visor() crea el visor ya abierto si aún no existe, así que antes hay que mirar si está en la página
const isVisorOpen = () => document.getElementById(VISOR_CONTAINER_ID) !== null && tfvis.visor().isOpen()

type N4LModelSummaryButtonProps = {
  model: unknown
  /** Nombre del modelo: es la pestaña del visor y va en el título del resumen */
  title: string
}

/**
 * Botón que abre (o cierra) el visor de tfjs-vis con el resumen de las capas de un modelo preentrenado, en una
 * pestaña propia del modelo. Solo aparece con un LayersModel: tfvis.show.modelSummary no admite el GraphModel de
 * MobileNet ni los detectores de @tensorflow-models, MediaPipe o face-api.
 */
export default function N4LModelSummaryButton({ model, title }: N4LModelSummaryButtonProps) {
  const { t } = useTranslation()

  // Al salir de la página el visor no debe quedarse abierto encima de la siguiente
  useEffect(() => () => {
    if (isVisorOpen()) tfvis.visor().close()
  }, [])

  if (!(model instanceof tfjs.LayersModel)) return null

  const handleClick_ToggleSummary = async () => {
    if (isVisorOpen()) {
      tfvis.visor().close()
      return
    }
    await tfvis.show.modelSummary({ name: `${t('model-summary')}: ${title}`, tab: title }, model)
    tfvis.visor().setActiveTab(title)
    tfvis.visor().open()
  }

  return (
    <div className={'d-grid mb-3'}>
      <Button size={'sm'} variant={'outline-primary'} onClick={handleClick_ToggleSummary}>
        <Trans i18nKey={'model-summary'} />
      </Button>
    </div>
  )
}
