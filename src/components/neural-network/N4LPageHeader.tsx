import { Col, Row } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import N4LGuide, { type GuideStep_t } from '@components/guide/N4LGuide'
import N4LSessionButtons from '@components/session/N4LSessionButtons'
import type { TrainingSession_t } from '@core/session/trainingSession'

type N4LPageHeaderProps = {
  title      : React.ReactNode
  /** Nombre con el que la guía guarda por qué paso va */
  guideId    : string
  /** Sin pasos todavía (el modelo se está cargando), no hay botón de guía */
  guideSteps : GuideStep_t[] | null
  /** Entrenadores: exportar, importar y compartir la configuración */
  getSession?: () => TrainingSession_t
  onImport?  : (text: string) => void
  /** Qué se hace en la página, en una frase y sus pasos: entrenar una red, probar un modelo ya entrenado o detectar */
  intro?     : 'train' | 'review' | 'detect'
  className? : string
}

/** La cabecera de las páginas del playground (entrenar y probar modelos): el título, la guía y, al entrenar, la configuración */
export default function N4LPageHeader({ title, guideId, guideSteps, getSession, onImport, intro, className = 'mt-3 mb-3' }: N4LPageHeaderProps) {
  const { t } = useTranslation()
  // Varios pasos por clave; sin traducciones (cargando, en las pruebas) i18next devuelve la clave: nada que listar
  const steps: unknown = intro === undefined ? [] : t('page-intro.' + intro + '.steps', { returnObjects: true })
  return (
    <Row className={className}>
      <Col xl={12}>
        <div className={'d-flex flex-wrap justify-content-between align-items-center gap-2'}>
          <h1>{title}</h1>
          <div className={'d-flex flex-wrap gap-2'}>
            {guideSteps !== null && <N4LGuide id={guideId} steps={guideSteps} compact={true} />}
            {getSession !== undefined && onImport !== undefined &&
              <div className={'d-flex flex-wrap gap-2'} data-guide={'session'}>
                <N4LSessionButtons getSession={getSession} onImport={onImport} />
              </div>}
          </div>
        </div>
        {/* Lo primero que se lee: qué se hace aquí y en qué orden (sin tener que abrir la guía) */}
        {intro !== undefined && <div className={'n4l-page-intro'} data-testid={'Test-PageIntro'}>
          <p className={'mb-1'}>{t('page-intro.' + intro + '.text')}</p>
          {Array.isArray(steps) && steps.length > 0 &&
            <ol className={'small mb-0'}>{steps.map((step) => <li key={String(step)}>{String(step)}</li>)}</ol>}
        </div>}
      </Col>
    </Row>
  )
}
