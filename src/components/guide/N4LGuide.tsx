import './N4LGuide.css'
import { createContext, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { Button, CloseButton, Form, ProgressBar } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { ArrowRepeat, PauseFill, PlayFill, Signpost2Fill, SkipStartFill, VolumeMuteFill, VolumeUpFill } from 'react-bootstrap-icons'
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps, type Step, type TooltipRenderProps } from 'react-joyride'

import { trackEvent } from '@core/analytics'

import { clearGuideProgress, readGuideProgress, saveGuideProgress, shouldRestore } from './guideProgress'
import { setGuideVoice, updateGuideSettings, useGuideSettings } from './guideSettings'
import { readingMs, useSpeech, useVoices, voicesForLanguage } from './speech'

/** Dónde va el bocadillo respecto al elemento ('auto': donde quepa; 'center': en medio de la pantalla) */
export type GuidePlacement_t = NonNullable<Step['placement']>

export type GuideStep_t = {
  /** Selector del elemento que señala; 'body' con placement 'center', en medio de la pantalla */
  target    : string
  title     : string
  /** Texto sin marcado: es también lo que se lee en voz alta */
  content   : string
  placement?: GuidePlacement_t
}

type N4LGuideProps = {
  /** Nombre de la guía: con él se guarda en el navegador por qué paso va */
  id      : string
  steps   : GuideStep_t[]
  /** Solo el botón, para ir entre otros (la cabecera de las páginas de entrenamiento): relleno y con icono, para que no
   * se confunda con los de al lado. Si no, ocupa todo el ancho */
  compact?: boolean
}

/** Lo que manejan los botones del bocadillo, que react-joyride pinta por su cuenta */
type GuideControls_t = {
  voice         : boolean
  voiceSupported: boolean
  speaking      : boolean
  auto          : boolean
  toggleVoice   : () => void
  toggleAuto    : () => void
  repeat        : () => void
  restart       : () => void
  /** Títulos de los pasos, para ir directamente a uno */
  titles        : string[]
  goTo          : (index: number) => void
  /** Voces del idioma de la aplicación y la elegida ("" si la elige la aplicación) */
  voices        : SpeechSynthesisVoice[]
  voiceURI      : string
  setVoice      : (voiceURI: string) => void
}

const GuideControls = createContext<GuideControls_t | null>(null)

/** El navegador deja hablar: hasta que se toca la página (también tras recargarla), speechSynthesis no suena */
const hasUserActivation = () =>
  (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive !== false

/**
 * Guía paso a paso de una página: el botón "Guía" la empieza y cada paso señala una parte de la página y explica qué
 * es, leyéndolo en voz alta. Se puede silenciar la voz, repetir el paso o dejar que avance sola al terminar de leer
 * cada uno. Se guarda por qué paso va: al recargar la página (el móvil lo hace al desbloquearlo) se vuelve a abrir en
 * ese paso si estaba abierta y, si se cerró, el botón sigue desde ahí. No arranca sola en ningún otro caso.
 */
export default function N4LGuide({ id, steps, compact = false }: N4LGuideProps) {
  const { t, i18n } = useTranslation()
  // Voz, avanzar solo, velocidad y voz elegida: los mismos que en /settings
  const { voice, auto, rate, voices: chosenVoices } = useGuideSettings()
  const language = (i18n.language || 'es').slice(0, 2)
  const voiceURI = chosenVoices[language] ?? ''
  const { supported, speaking, speak, cancel } = useSpeech(i18n.language, { voiceURI, rate })
  const languageVoices = voicesForLanguage(useVoices(), language)

  // Lo guardado antes de recargar o de una visita anterior
  const [saved] = useState(() => readGuideProgress(id))
  const [run, setRun] = useState(false)
  // El paso que se ve o, con la guía cerrada, desde el que sigue el botón
  const [stepIndex, setStepIndex] = useState(() => Math.min(saved?.step ?? 0, Math.max(0, steps.length - 1)))
  // Cada "Repetir" vuelve a leer el paso
  const [repeats, setRepeats] = useState(0)
  // El paso que se ha terminado de leer: con "avanzar solo", entonces se pasa al siguiente
  const [spoken, setSpoken] = useState<number | null>(null)
  // Al empezar: el color del bocadillo (para su flecha) y lo que tapa la barra de navegación fija
  const [layout, setLayout] = useState({ arrow: '#fff', scrollOffset: 80 })

  const voiceActive = voice && supported
  const step = run ? steps[stepIndex] : undefined
  // Lo que se lee: el título y la explicación, con un punto entre los dos si el título no termina ya en uno (o en "?")
  const text = step ? `${step.title}${/[.!?:。！？]$/u.test(step.title) ? '' : '.'} ${step.content}` : ''

  const start = (index: number) => {
    const navbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--n4l-navbar-height')) || 60
    setLayout({ arrow: getComputedStyle(document.body).backgroundColor, scrollOffset: navbar + 24 })
    setSpoken(null)
    setStepIndex(index)
    setRun(true)
    saveGuideProgress(id, index, true)
    trackEvent('guide_start', { guide_id: id, step: index + 1, steps: steps.length })
  }

  // Terminada: la próxima vez, desde el principio
  const finish = () => {
    setRun(false)
    setStepIndex(0)
    setSpoken(null)
    cancel()
    clearGuideProgress(id)
    trackEvent('guide_end', { guide_id: id, step: steps.length, steps: steps.length, outcome: 'completed' })
  }

  // Cerrada a medias: no se vuelve a abrir sola y el botón sigue desde este paso
  const close = (index: number) => {
    setRun(false)
    setSpoken(null)
    cancel()
    saveGuideProgress(id, index, false)
    trackEvent('guide_end', { guide_id: id, step: index + 1, steps: steps.length, outcome: 'closed' })
  }

  const goTo = (index: number) => {
    if (index >= steps.length) {
      finish()
      return
    }
    const next = Math.max(0, index)
    setSpoken(null)
    setStepIndex(next)
    saveGuideProgress(id, next, true)
  }

  const handleCallback = ({ action, index, status, type }: CallBackProps) => {
    if (status === STATUS.FINISHED) {
      finish()
      return
    }
    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      close(index)
      return
    }
    // Siguiente o atrás; un paso cuyo elemento no está en la página se salta. Solo los del paso que se ve: al cambiarlo
    // desde fuera (desplegable de pasos, avanzar solo, volver al principio), react-joyride avisa también del anterior,
    // y moverse otra vez desde él llevaba a otro paso
    if ((type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) && index === stepIndex) {
      goTo(index + (action === ACTIONS.PREV ? -1 : 1))
    }
  }

  // Abierta hace poco: se ha recargado la página. Se vuelve a abrir en su paso cuando el elemento que señala ya está
  // (los datos del modelo tardan un poco); si no aparece en 10 s, se abre igual y ese paso se salta
  const restore = useEffectEvent((force: boolean) => {
    const target = steps[stepIndex]?.target
    if (!force && target !== undefined && target !== 'body' && document.querySelector(target) === null) return false
    start(stepIndex)
    return true
  })
  useEffect(() => {
    if (!shouldRestore(saved)) return
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      if (restore(tries >= 50)) window.clearInterval(timer)
    }, 200)
    return () => window.clearInterval(timer)
  }, [saved])

  // Cada paso se lee al mostrarse (y otra vez con "Repetir"). Recién recargada la página, el navegador no deja hablar
  // hasta que se toca algo: se lee entonces
  useEffect(() => {
    if (!run || !voiceActive || text === '') return
    const index = stepIndex
    const read = () => speak(text, () => setSpoken(index))
    if (hasUserActivation()) {
      read()
      return () => cancel()
    }
    let done = false
    const onInteraction = () => {
      if (done) return
      done = true
      read()
    }
    window.addEventListener('click', onInteraction, true)
    window.addEventListener('keydown', onInteraction, true)
    return () => {
      window.removeEventListener('click', onInteraction, true)
      window.removeEventListener('keydown', onInteraction, true)
      cancel()
    }
  }, [run, voiceActive, text, stepIndex, repeats, speak, cancel])

  // Avanzar solo: con voz, al terminar de leer el paso (y, por si el navegador no avisa, como mucho el doble de lo que
  // se tarda en leerlo); sin voz, lo que se tarda en leerlo. En el último paso se queda, y tras recargar espera a que
  // se toque la página (hasta entonces no se ha leído nada)
  const advance = useEffectEvent(() => {
    if (stepIndex < steps.length - 1) goTo(stepIndex + 1)
  })
  useEffect(() => {
    if (!run || !auto || text === '') return
    if (voiceActive && !hasUserActivation()) return
    const delay = !voiceActive ? readingMs(text) : spoken === stepIndex ? 800 : readingMs(text) * 2 + 3000
    const timer = window.setTimeout(advance, delay)
    return () => window.clearTimeout(timer)
  }, [run, auto, voiceActive, spoken, stepIndex, text])

  const controls: GuideControls_t = {
    voice         : voiceActive,
    voiceSupported: supported,
    speaking,
    auto,
    toggleVoice   : () => updateGuideSettings({ voice: !voice }),
    toggleAuto    : () => updateGuideSettings({ auto: !auto }),
    repeat        : () => {
      setSpoken(null)
      setRepeats((count) => count + 1)
    },
    restart : () => goTo(0),
    titles  : steps.map(({ title }) => title),
    goTo,
    voices  : languageVoices,
    voiceURI: languageVoices.some((option) => option.voiceURI === voiceURI) ? voiceURI : '',
    // Con otra voz se vuelve a leer el paso (el efecto de la lectura depende de la voz)
    setVoice: (uri: string) => {
      setSpoken(null)
      setGuideVoice(language, uri)
    },
  }

  const joyrideSteps = useMemo<Step[]>(() => steps.map(({ target, title, content, placement }) => ({
    target,
    title,
    content,
    placement       : placement ?? 'auto',
    disableBeacon   : true,
    spotlightPadding: 6,
  })), [steps])

  const button = (
    <Button size={'sm'} variant={compact ? 'primary' : 'outline-primary'} className={compact ? 'text-nowrap' : undefined}
      onClick={() => start(stepIndex)} title={t('guide.button-title')} data-testid={'Test-GuideButton'}>
      {compact && <Signpost2Fill className={'me-1'} aria-hidden={true} />}
      {/* Cerrada a medias, sigue desde ese paso; abierta, el paso ya se ve en el bocadillo */}
      {!run && stepIndex > 0 ? t('guide.resume', { current: stepIndex + 1, total: steps.length }) : t('guide.button')}
    </Button>
  )

  return <>
    {compact ? button : <div className={'d-grid mb-2'}>{button}</div>}
    {run &&
      <GuideControls.Provider value={controls}>
        <Joyride run={true}
          steps={joyrideSteps}
          stepIndex={stepIndex}
          continuous={true}
          callback={handleCallback}
          tooltipComponent={GuideTooltip}
          scrollOffset={layout.scrollOffset}
          disableOverlayClose={true}
          spotlightClicks={true}
          locale={{ back: t('guide.back'), close: t('guide.close'), last: t('guide.finish'), next: t('guide.next'), skip: t('guide.close') }}
          // Por encima de la barra de navegación (1030) y del visor de tfjs-vis; por debajo de los modales (1055)
          styles={{ options: { zIndex: 1050, arrowColor: layout.arrow } }} />
      </GuideControls.Provider>}
  </>
}

/** El bocadillo de cada paso: progreso, título, explicación, controles de la voz y botones para moverse */
function GuideTooltip({ index, size, step, backProps, primaryProps, closeProps, tooltipProps }: TooltipRenderProps) {
  const controls = useContext(GuideControls)
  const { t } = useTranslation()
  if (controls === null) return null

  const voiceLabel = !controls.voiceSupported ? t('guide.no-voice') : t(controls.voice ? 'guide.voice-off' : 'guide.voice-on')
  const autoLabel = t(controls.auto ? 'guide.auto-off' : 'guide.auto-on')
  const VoiceIcon = controls.voice ? VolumeUpFill : VolumeMuteFill
  const AutoIcon = controls.auto ? PauseFill : PlayFill

  return (
    <div {...tooltipProps} className={'n4l-guide-tooltip'} data-testid={'Test-GuideTooltip'}>
      <ProgressBar now={((index + 1) / size) * 100} className={'n4l-guide-progress'} aria-hidden={true} />
      <div className={'d-flex align-items-start justify-content-between gap-2'}>
        <div>
          <div className={'small text-body-secondary'}>{t('guide.step', { current: index + 1, total: size })}</div>
          <h2 className={'h5 mb-2'}>{step.title}</h2>
        </div>
        {/* Sin el resto de closeProps: react-joyride también le pasa el texto (children) y se veía junto a la X */}
        <CloseButton aria-label={closeProps['aria-label']} title={closeProps.title}
          data-action={closeProps['data-action']} onClick={closeProps.onClick} />
      </div>
      <p className={'n4l-guide-content'}>{step.content}</p>
      <div className={'d-flex flex-wrap align-items-center gap-2'}>
        <div className={'d-flex gap-1'}>
          <Button size={'sm'} variant={controls.voice ? 'primary' : 'outline-secondary'}
            className={controls.speaking ? 'n4l-guide-speaking' : undefined}
            aria-label={voiceLabel} title={voiceLabel}
            disabled={!controls.voiceSupported}
            onClick={controls.toggleVoice}
            data-testid={'Test-GuideVoice'}>
            <VoiceIcon aria-hidden={true} />
          </Button>
          <Button size={'sm'} variant={'outline-secondary'}
            aria-label={t('guide.repeat')} title={t('guide.repeat')}
            disabled={!controls.voice}
            onClick={controls.repeat}>
            <ArrowRepeat aria-hidden={true} />
          </Button>
          <Button size={'sm'} variant={controls.auto ? 'primary' : 'outline-secondary'}
            aria-label={autoLabel} title={autoLabel}
            onClick={controls.toggleAuto}
            data-testid={'Test-GuideAuto'}>
            <AutoIcon aria-hidden={true} />
          </Button>
          {index > 0 &&
            <Button size={'sm'} variant={'outline-secondary'}
              aria-label={t('guide.restart')} title={t('guide.restart')}
              onClick={controls.restart}
              data-testid={'Test-GuideRestart'}>
              <SkipStartFill aria-hidden={true} />
            </Button>}
        </div>
        <div className={'d-flex gap-2 ms-auto'}>
          {index > 0 && <Button size={'sm'} variant={'outline-secondary'} {...backProps}>{backProps.title}</Button>}
          <Button size={'sm'} variant={'primary'} {...primaryProps}>{primaryProps.title}</Button>
        </div>
      </div>
      {/* Ir directamente a un paso y elegir la voz (las del idioma de la aplicación) */}
      <div className={'n4l-guide-options'}>
        <Form.Group controlId={'n4l-guide-step'} className={'n4l-guide-option'}>
          <Form.Label className={'small text-body-secondary mb-1'}>{t('guide.go-to')}</Form.Label>
          <Form.Select size={'sm'} value={index} onChange={(event) => controls.goTo(Number(event.target.value))}
            data-testid={'Test-GuideStepSelect'}>
            {controls.titles.map((title, option) => <option key={option} value={option}>{`${option + 1}. ${title}`}</option>)}
          </Form.Select>
        </Form.Group>
        {controls.voiceSupported && controls.voices.length > 0 &&
          <Form.Group controlId={'n4l-guide-voice'} className={'n4l-guide-option'}>
            <Form.Label className={'small text-body-secondary mb-1'}>{t('guide.voice')}</Form.Label>
            <Form.Select size={'sm'} value={controls.voiceURI} disabled={!controls.voice}
              onChange={(event) => controls.setVoice(event.target.value)}
              data-testid={'Test-GuideVoiceSelect'}>
              <option value={''}>{t('guide.voice-auto')}</option>
              {controls.voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {/* Las que no son del sistema funcionan en un servidor del navegador: el texto se envía allí */}
                  {voice.localService ? voice.name : `${voice.name} · ${t('guide.voice-online')}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>}
      </div>
    </div>
  )
}
