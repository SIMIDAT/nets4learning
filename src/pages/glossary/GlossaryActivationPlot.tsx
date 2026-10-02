// Chart.js con sus escalas y elementos registrados (también lo hace App, pero así no depende de ello)
import '../../ConfigChartJS'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form, Tab, Tabs } from 'react-bootstrap'
import { Line } from 'react-chartjs-2'
import { PauseFill, PlayFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@hooks/useTheme'
import { ACTIVATION_DOMAIN, activationCurve, activationRange, activationX, type ActivationFunction_t } from './activationFunctions'

// Lo que tarda en dibujarse la curva de principio a fin al reproducirla
const DURATION_MS = 3000

const COLORS = {
  light: { line: '#0d6efd', text: '#495057', grid: 'rgba(0, 0, 0, .08)', axis: 'rgba(0, 0, 0, .45)' },
  dark : { line: '#6ea8fe', text: '#dee2e6', grid: 'rgba(255, 255, 255, .12)', axis: 'rgba(255, 255, 255, .5)' },
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * La curva de la activación se dibuja hasta la x que marca el deslizador (de 0 a 1: el principio y el final del
 * dominio), con el punto (x, f(x)) y sus valores debajo. Al abrir la pestaña se dibuja sola; "Reproducir" la repite.
 */
function ActivationAnimation({ activation }: { activation: ActivationFunction_t }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const prefix = 'pages.glossary.animation.'
  const { name, fn, params } = activation
  // Sin animaciones si el sistema las pide reducidas: la curva sale entera
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0))
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  // El valor del deslizador para el bucle de la animación (que no se vuelve a crear en cada fotograma)
  const progressRef = useRef(progress)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const next = Math.min(1, progressRef.current + (now - last) / DURATION_MS)
      last = now
      progressRef.current = next
      setProgress(next)
      if (next >= 1) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const handleChange_Progress = (value: number) => {
    progressRef.current = value
    setProgress(value)
    setPlaying(false)
  }

  const handleClick_Play = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    // Al final, empieza otra vez desde el principio
    if (progressRef.current >= 1) {
      progressRef.current = 0
      setProgress(0)
    }
    setPlaying(true)
  }

  const x = activationX(progress)
  const y = fn(x)
  const range = useMemo(() => activationRange(fn), [fn])
  const colors = COLORS[theme]
  const format = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  // + 0: sin "-0,00"
  const show = (value: number) => format.format(value + 0)
  const axisGrid = { color: (context: { tick?: { value: number } }) => (context.tick?.value === 0 ? colors.axis : colors.grid) }

  return (
    <div className={'n4l-glossary-animation'} data-testid={'Test-GlossaryAnimation'}>
      <div className={'n4l-glossary-animation-chart'}>
        <Line
          role={'img'}
          aria-label={t('pages.glossary.plot', { term: name })}
          data={{
            datasets: [
              { data: activationCurve(fn, x), borderColor: colors.line, borderWidth: 2.5, pointRadius: 0 },
              { data: [{ x, y }], borderColor: colors.line, backgroundColor: colors.line, pointRadius: 5, showLine: false },
            ],
          }}
          options={{
            responsive         : true,
            maintainAspectRatio: false,
            animation          : false,
            plugins            : { legend: { display: false }, tooltip: { enabled: false } },
            scales             : {
              x: {
                type : 'linear',
                min  : ACTIVATION_DOMAIN[0],
                max  : ACTIVATION_DOMAIN[1],
                ticks: { stepSize: 2, color: colors.text },
                grid : axisGrid,
                title: { display: true, text: 'x', color: colors.text },
              },
              y: {
                type : 'linear',
                min  : range[0],
                max  : range[1],
                // Sin las marcas de los extremos (el margen): se juntaban con las de al lado
                ticks: { color: colors.text, maxTicksLimit: 7, includeBounds: false },
                grid : axisGrid,
                title: { display: true, text: `${name}(x)`, color: colors.text },
              },
            },
          }}
        />
      </div>
      <div className={'d-flex align-items-center gap-2 mt-2'}>
        <Button size={'sm'} variant={'outline-primary'} className={'text-nowrap d-inline-flex align-items-center gap-1'} onClick={handleClick_Play}>
          {playing ? <PauseFill aria-hidden={true} /> : <PlayFill aria-hidden={true} />} {t(prefix + (playing ? 'pause' : 'play'))}
        </Button>
        <Form.Range min={0} max={1} step={0.01}
          value={progress}
          onChange={(event) => handleChange_Progress(Number(event.target.value))}
          aria-label={t(prefix + 'slider', { name })}
          aria-valuetext={`x = ${show(x)}`} />
      </div>
      <p className={'small text-body-secondary mb-0 mt-1'} aria-live={'off'} data-testid={'Test-GlossaryAnimationValue'}>
        <span className={'font-monospace'}>x = {show(x)} → {name}(x) = {show(y)}</span>
        {params !== undefined && <> · {params}</>}
      </p>
    </div>
  )
}

type GlossaryActivationPlotProps = {
  /** Id del término (para los ids de las pestañas) */
  id        : string
  image     : string
  imageAlt  : string
  activation: ActivationFunction_t
}

/** Gráfica de una activación en dos pestañas: la imagen (primero) y la curva animada */
export default function GlossaryActivationPlot({ id, image, imageAlt, activation }: GlossaryActivationPlotProps) {
  const { t } = useTranslation()
  return (
    // mountOnEnter / unmountOnExit: la animación se crea al abrir su pestaña y vuelve a empezar cada vez
    <Tabs defaultActiveKey={'image'} id={`glossary-plot-${id}`} className={'n4l-glossary-plot-tabs mt-2'} mountOnEnter unmountOnExit>
      <Tab eventKey={'image'} title={t('pages.glossary.plot-tabs.image')}>
        <div className={'n4l-glossary-plot'}>
          <img src={image} alt={imageAlt} loading={'lazy'} />
        </div>
      </Tab>
      <Tab eventKey={'animation'} title={t('pages.glossary.plot-tabs.animation')}>
        <ActivationAnimation activation={activation} />
      </Tab>
    </Tabs>
  )
}
