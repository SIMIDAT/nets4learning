import { Col, Row } from 'react-bootstrap'

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
  className? : string
}

/** La cabecera de las páginas del playground (entrenar y probar modelos): el título, la guía y, al entrenar, la configuración */
export default function N4LPageHeader({ title, guideId, guideSteps, getSession, onImport, className = 'mt-3 mb-3' }: N4LPageHeaderProps) {
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
      </Col>
    </Row>
  )
}
