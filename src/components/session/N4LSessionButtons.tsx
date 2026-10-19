import { useRef } from 'react'
import { Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import { downloadSession, type TrainingSession_t } from '@core/session/trainingSession'
import N4LShareSession from '@components/session/N4LShareSession'

type N4LSessionButtonsProps = {
  /** La configuración actual de la página: se exporta como fichero o se comparte con un enlace */
  getSession: () => TrainingSession_t
  /** Recibe el texto del fichero elegido */
  onImport  : (text: string) => void
}

/** Exportar, importar y compartir la configuración (capas e hiperparámetros) de una página de entrenamiento */
export default function N4LSessionButtons({ getSession, onImport }: N4LSessionButtonsProps) {
  const input_ref = useRef<HTMLInputElement>(null)

  const handleChange_File = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Se vacía para poder volver a elegir el mismo fichero
    event.target.value = ''
    if (file !== undefined) onImport(await file.text())
  }

  return (
    <>
      <N4LShareSession getSession={getSession} />
      <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap'} onClick={() => downloadSession(getSession())}>
        <Trans i18nKey={'session.export'} />
      </Button>
      <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap'} onClick={() => input_ref.current?.click()}>
        <Trans i18nKey={'session.import'} />
      </Button>
      <input ref={input_ref} type={'file'} accept={'.json,application/json'} className={'d-none'}
        data-testid={'Test-SessionImport'} onChange={handleChange_File} />
    </>
  )
}
