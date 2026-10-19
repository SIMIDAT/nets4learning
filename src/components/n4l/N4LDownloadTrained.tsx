import { useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import type * as tfjs from '@tensorflow/tfjs'

import { trackEvent } from '@core/analytics'
import { n4lFileName } from '@core/n4l/export'
import { packTrainedModel } from '@core/n4l/exportTrained'
import type { N4LLayer_t, N4LModelInput_t } from '@core/n4l/format'
import type { N4LPackage_t } from '@core/n4l/source'

type N4LDownloadTrainedProps = {
  /** El paquete del conjunto con el que se entrenó; sin él (un CSV subido) no hay botón */
  pkg    : N4LPackage_t | null
  task   : string
  model  : tfjs.LayersModel
  /** Sus capas, como en el manifiesto (serán la red por defecto al entrenar con el paquete) */
  layers : N4LLayer_t[]
  /** Lo que recibe, si es una tabla */
  input? : N4LModelInput_t
  /** Las clases en el orden de las salidas del modelo */
  classes: string[]
  history: Record<string, number[]>
  /** Su número en la tabla */
  number : number
}

/** Descargar un modelo entrenado en un .n4l (con el conjunto, su preprocesado y sus textos), para abrirlo después */
export default function N4LDownloadTrained({ pkg, task, model, layers, input, classes, history, number }: N4LDownloadTrainedProps) {
  const { t } = useTranslation()
  const [isPacking, setIsPacking] = useState(false)
  if (pkg === null) return null

  const handleClick = async () => {
    setIsPacking(true)
    try {
      // Las métricas de la última época
      const metrics = Object.fromEntries(Object.entries(history)
        .map(([name, values]) => [name, values.at(-1)] as const)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])))
      const { manifest, blob } = await packTrainedModel(pkg, task, {
        model,
        layers,
        classes,
        number,
        metrics,
        input,
      }, (_language, name) => `${name} (#${number})`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = n4lFileName(manifest)
      link.click()
      URL.revokeObjectURL(url)
      trackEvent('n4l_download', { item: manifest.id })
    } finally {
      setIsPacking(false)
    }
  }

  return (
    <Button variant={'outline-secondary'} size={'sm'} onClick={handleClick} disabled={isPacking} title={t('n4l.download-trained-title')}
      data-testid={`Test-N4LDownloadTrained-${number}`}>
      {isPacking && <Spinner size={'sm'} className={'me-2'} />}
      {t('n4l.download')}
    </Button>
  )
}
