import React, { useCallback, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import type { LastTraining_t, TrainingProgress_t } from '@hooks/useTrainingProgress'
import { formatDuration } from '@core/format/duration'
import N4LProgressBar from '@components/loading/N4LProgressBar'
import { goToSection } from '@components/divider/useActiveSection'
import { sectionId } from '@components/divider/sectionId'

type N4LTrainButtonProps = {
  isTraining    : boolean
  progress      : TrainingProgress_t | null
  isStopping    : boolean
  onStop        : () => void
  disabled?     : boolean
  /**
   * La sección con el resultado (su i18nKey), si queda lejos del botón: al terminar de entrenar, un enlace lleva a ella
   * (WCAG 2.4.3), sin recorrer con el tabulador lo que hay en medio
   */
  resultSection?: string
  /** Lo que tardó el último entrenamiento (useTrainingProgress): se dice para saber qué esperar del siguiente */
  lastRun?      : LastTraining_t | null
  children      : React.ReactNode
}

/**
 * Botón de entrenar del formulario (type="submit"). Mientras se entrena, en su lugar se ve el progreso por épocas
 * y un botón para detener el entrenamiento (el modelo se guarda con las épocas que haya completado).
 *
 * El foco no se pierde al cambiar uno por otro (WCAG 2.4.3): si estaba en «Entrenar», pasa a «Detener», y al terminar
 * vuelve a «Entrenar». Por eso «Deteniendo…» no se desactiva con disabled (que quita el foco), sino con aria-disabled.
 */
export default function N4LTrainButton({ isTraining, progress, isStopping, onStop, disabled = false, resultSection, lastRun = null, children }: N4LTrainButtonProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'pages.playground.generator.training.'

  // Al quitarse un botón (antes de salir de la página) se apunta si tenía el foco; el que lo sustituye lo recoge
  const keepFocus = useRef(false)
  const passFocus = useCallback((element: HTMLButtonElement | null) => {
    if (element === null) return
    if (keepFocus.current) element.focus({ preventScroll: true })
    keepFocus.current = false
    return () => {
      keepFocus.current = document.activeElement === element
    }
  }, [])

  // Se ha entrenado al menos una vez en esta visita: ya hay un resultado al que ir
  const [wasTraining, setWasTraining] = useState(isTraining)
  const [hasTrained, setHasTrained] = useState(false)
  if (wasTraining !== isTraining) {
    setWasTraining(isTraining)
    if (!isTraining) setHasTrained(true)
  }

  if (!isTraining) {
    const resultId = resultSection === undefined ? null : sectionId(resultSection)
    return (
      <div className={'d-grid gap-2'}>
        <Button ref={passFocus} variant={'primary'} size={'lg'} type={'submit'} disabled={disabled} data-testid={'Test-TrainButton'}>
          {children}
        </Button>
        {/* Cuánto tardó el anterior: con más épocas, el siguiente tardará más (y se puede parar cuando se quiera) */}
        {lastRun !== null &&
          <p className={'small text-body-secondary text-center mb-0'} data-testid={'Test-TrainButton-LastRun'}>
            {t(prefix + 'last-run', {
              time    : formatDuration(lastRun.ms, i18n.language),
              perEpoch: formatDuration(lastRun.ms / lastRun.epochs, i18n.language),
              count   : lastRun.epochs,
            })}
          </p>}
        {hasTrained && resultId !== null &&
          <a href={'#' + resultId} className={'text-center'} onClick={(event) => goToSection(event, resultId)} data-testid={'Test-GoToResult'}>
            <Trans i18nKey={prefix + 'go-to-result'} />
          </a>}
      </div>
    )
  }

  // Antes de la primera época se preparan los datos y se compila el modelo
  const percent = progress ? Math.round((progress.epoch / progress.totalEpochs) * 100) : 0
  // Desde la primera época, también lo que queda (a la velocidad de las épocas hechas)
  const remaining = progress?.remainingMs !== undefined && progress.epoch < progress.totalEpochs
    ? ', ' + t(prefix + 'remaining', { time: formatDuration(progress.remainingMs, i18n.language) })
    : ''
  const label = progress
    ? t(prefix + 'epoch', { epoch: progress.epoch, total: progress.totalEpochs }) + remaining
    : t(prefix + 'preparing')

  return (
    // Sin aria-live: cambia en cada época; el lector oye cómo va cada pocos segundos (useTrainingProgress)
    <div className={'d-flex align-items-center gap-2'}>
      <div className={'flex-grow-1'}>
        <div className={'small mb-1'}>{label}</div>
        <N4LProgressBar now={percent} striped={true} animated={true} label={label} />
      </div>
      <Button ref={passFocus} variant={'outline-danger'} onClick={isStopping ? undefined : onStop}
        aria-disabled={isStopping} className={isStopping ? 'disabled' : undefined} data-testid={'Test-StopButton'}>
        <Trans i18nKey={prefix + (isStopping ? 'stopping' : 'stop')} />
      </Button>
    </div>
  )
}
