import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Container, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { UPLOAD } from '@/TASKS'
import { taskOptions } from '@/TASK_OPTIONS'
import { readReport } from '@core/report/trainingReport'
import { historyCurves } from '@core/history/trainingSummary'
import N4LTrainingCurves from '@components/neural-network/N4LTrainingCurves'
import N4LTrainingDiagnosis from '@components/neural-network/N4LTrainingDiagnosis'
import N4LConfusionMatrix from '@components/neural-network/N4LConfusionMatrix'
import N4LEmptyState from '@components/loading/N4LEmptyState'

const prefix = 'report.'

/**
 * El informe de un modelo entrenado (desde «Informe» en la tabla de modelos): la tarea y los datos, la red, los
 * hiperparámetros, cómo fue el entrenamiento (curvas, valores finales, diagnóstico) y, en clasificación, los aciertos
 * y la matriz de confusión. Pensado para imprimirlo o guardarlo en PDF y entregarlo.
 */
export default function TrainingReport() {
  const { t, i18n } = useTranslation()
  const report = useMemo(() => readReport(), [])
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 4 }), [i18n.language])

  // Una pestaña abierta con window.open en segundo plano no tiene tamaño ni dibuja (sin requestAnimationFrame): las
  // gráficas (Chart.js) se quedarían con el tamaño de ese momento, diminutas. Se dibujan al verse la pestaña
  const isShown = () => document.visibilityState === 'visible' && window.innerWidth > 0
  const [hasSize, setHasSize] = useState(isShown)
  useEffect(() => {
    if (hasSize) return
    const check = () => { if (isShown()) setHasSize(true) }
    const timer = window.setInterval(check, 200)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('resize', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('resize', check)
    }
  }, [hasSize])

  // Al imprimir, cada gráfica (Chart.js no se redibuja bien al cambiar al tamaño del papel) sale como la imagen de lo
  // que se ve en pantalla; al acabar, vuelven las gráficas. También con Ctrl+P, no solo con el botón
  useEffect(() => {
    const before = () => {
      document.querySelectorAll<HTMLCanvasElement>('.n4l-report canvas:not(.n4l-print-hidden)').forEach((canvas) => {
        const image = document.createElement('img')
        image.src = canvas.toDataURL('image/png')
        image.alt = ''
        image.className = 'n4l-print-image'
        canvas.after(image)
        canvas.classList.add('n4l-print-hidden')
      })
    }
    const after = () => {
      document.querySelectorAll('.n4l-report .n4l-print-image').forEach((image) => image.remove())
      document.querySelectorAll('.n4l-report .n4l-print-hidden').forEach((canvas) => canvas.classList.remove('n4l-print-hidden'))
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  if (report === null) {
    return (
      <main className={'mb-4'} data-title={'Report'} data-testid={'Test-Report'}>
        <Container className={'mt-3'}>
          <h1>{t(prefix + 'title')}</h1>
          <N4LEmptyState i18nKey={prefix + 'empty'} />
        </Container>
      </main>
    )
  }

  const datasetTitle = report.dataset === UPLOAD
    ? t(prefix + 'uploaded')
    : t(taskOptions(report.task, 'dataset').find(({ value }) => value === report.dataset)?.i18n ?? report.dataset)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(report.createdAt))
  const curves = historyCurves(report.history)
  const format = (values: number[] | null) => {
    const last = values?.at(-1)
    return last === undefined ? '—' : Number.isFinite(last) ? number.format(last) : '—'
  }

  return (
    <main className={'mb-4 n4l-report'} data-title={'Report'} data-testid={'Test-Report'}>
      <Container className={'mt-3'}>
        <div className={'d-flex flex-wrap align-items-start justify-content-between gap-2'}>
          <div>
            <h1 className={'mb-1'}>{t(prefix + 'title')}</h1>
            <p className={'lead mb-1'}>
              {t('pages.index.' + report.task + '.1-title')} · {datasetTitle} · {t('model.__index__', { index: report.model })}
            </p>
            <p className={'small text-body-secondary'}>{t(prefix + 'created', { date })} · Nets4Learning</p>
          </div>
          <div className={'d-flex gap-2 d-print-none'}>
            <Button onClick={() => window.print()} data-testid={'Test-Report-Print'}>{t(prefix + 'print')}</Button>
            <Link to={`/playground/${report.task}/dataset/${report.dataset}`} className={'btn btn-outline-secondary'}>{t(prefix + 'back')}</Link>
          </div>
        </div>

        <Row xs={1} lg={2} className={'g-3 mt-1'}>
          <Col>
            <Card className={'h-100'} data-testid={'Test-Report-Layers'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'network')}</h2></Card.Header>
              <Card.Body>
                <ol className={'mb-0'}>{report.layers.map((layer, index) => <li key={index}>{layer}</li>)}</ol>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className={'h-100'} data-testid={'Test-Report-Parameters'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'hyperparameters')}</h2></Card.Header>
              <Card.Body>
                <Table size={'sm'} className={'mb-0'}>
                  <tbody>
                    {Object.entries(report.parameters).filter(([name]) => name !== 'layers').map(([name, value]) => (
                      <tr key={name}><th scope={'row'} className={'fw-normal'}>{t('generator.table-models.' + name)}</th><td>{value}</td></tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className={'mt-3'} data-testid={'Test-Report-Results'}>
          <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'results')}</h2></Card.Header>
          <Card.Body>
            <Table size={'sm'} className={'w-auto'}>
              <caption className={'small'}>{t(prefix + 'results-caption')}</caption>
              <thead>
                <tr><th scope={'col'}>{t(prefix + 'metric')}</th><th scope={'col'}>{t('pages.playground.generator.training.train')}</th><th scope={'col'}>{t('pages.playground.generator.training.validation')}</th></tr>
              </thead>
              <tbody>
                {curves.map(({ name, train, validation }) => (
                  <tr key={name}><th scope={'row'} className={'fw-normal'}>{name}</th><td>{format(train)}</td><td>{format(validation)}</td></tr>
                ))}
              </tbody>
            </Table>
            <N4LTrainingDiagnosis history={report.history} model={report.model} />
            {hasSize && <N4LTrainingCurves histories={[report.history]} />}
            {report.evaluation !== undefined && <N4LConfusionMatrix {...report.evaluation} />}
          </Card.Body>
        </Card>
      </Container>
    </main>
  )
}
