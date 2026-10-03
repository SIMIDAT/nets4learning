import React from 'react'
import { Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import type { TrainingProgress_t } from '@hooks/useTrainingProgress'
import N4LProgressBar from '@components/loading/N4LProgressBar'

type N4LTrainButtonProps = {
  isTraining: boolean
  progress  : TrainingProgress_t | null
  isStopping: boolean
  onStop    : () => void
  disabled? : boolean
  children  : React.ReactNode
}

/**
 * Botón de entrenar del formulario (type="submit"). Mientras se entrena, en su lugar se ve el progreso por épocas
 * y un botón para detener el entrenamiento (el modelo se guarda con las épocas que haya completado).
 */
export default function N4LTrainButton({ isTraining, progress, isStopping, onStop, disabled = false, children }: N4LTrainButtonProps) {
  const { t } = useTranslation()
  const prefix = 'pages.playground.generator.training.'

  if (!isTraining) {
    return (
      <div className={'d-grid gap-2'}>
        <Button variant={'primary'} size={'lg'} type={'submit'} disabled={disabled} data-testid={'Test-TrainButton'}>
          {children}
        </Button>
      </div>
    )
  }

  // Antes de la primera época se preparan los datos y se compila el modelo
  const percent = progress ? Math.round((progress.epoch / progress.totalEpochs) * 100) : 0
  const label = progress
    ? t(prefix + 'epoch', { epoch: progress.epoch, total: progress.totalEpochs })
    : t(prefix + 'preparing')

  return (
    <div className={'d-flex align-items-center gap-2'} role={'status'} aria-live={'polite'}>
      <div className={'flex-grow-1'}>
        <div className={'small mb-1'}>{label}</div>
        <N4LProgressBar now={percent} striped={true} animated={true} label={label} />
      </div>
      <Button variant={'outline-danger'} onClick={onStop} disabled={isStopping}>
        <Trans i18nKey={prefix + (isStopping ? 'stopping' : 'stop')} />
      </Button>
    </div>
  )
}
