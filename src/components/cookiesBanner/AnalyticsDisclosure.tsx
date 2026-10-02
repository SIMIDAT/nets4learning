import { Col, Row } from 'react-bootstrap'
import { CheckCircleFill, XCircleFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

/** Qué mide Google Analytics y qué no se envía nunca (el aviso de cookies y los términos dicen lo mismo) */
export default function AnalyticsDisclosure() {
  const { t } = useTranslation()
  // Sin las traducciones cargadas, t devuelve la clave: entonces no hay lista
  const list = (key: string): string[] => {
    const value: unknown = t(key, { returnObjects: true })
    return Array.isArray(value) ? value : []
  }

  return (
    <Row className={'g-3 small'} data-testid={'Test-AnalyticsDisclosure'}>
      <Col md={6}>
        <p className={'fw-semibold mb-1'}>{t('cookies-policies.measured-title')}</p>
        <ul className={'list-unstyled mb-0'}>
          {list('cookies-policies.measured').map((item) => (
            <li key={item} className={'d-flex gap-2 mb-1'}>
              <CheckCircleFill className={'text-success flex-shrink-0 mt-1'} aria-hidden={true} />{item}
            </li>
          ))}
        </ul>
      </Col>
      <Col md={6}>
        <p className={'fw-semibold mb-1'}>{t('cookies-policies.never-title')}</p>
        <ul className={'list-unstyled mb-0'}>
          {list('cookies-policies.never').map((item) => (
            <li key={item} className={'d-flex gap-2 mb-1'}>
              <XCircleFill className={'text-danger flex-shrink-0 mt-1'} aria-hidden={true} />{item}
            </li>
          ))}
        </ul>
      </Col>
    </Row>
  )
}
