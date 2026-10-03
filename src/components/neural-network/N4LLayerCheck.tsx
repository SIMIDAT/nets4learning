import { Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { LayerIssue_t } from '@core/nn-utils/checkLayers'
import { trackEvent } from '@core/analytics'
import { issueValues, LAYER_CHECK_PREFIX as prefix } from '@components/neural-network/layerCheckText'

/** La marca de una capa con algo que revisar, en la cabecera de su acordeón */
export function N4LLayerFlag({ severity }: { severity?: 'error' | 'warning' }) {
  const { t } = useTranslation()
  if (severity === undefined) return null
  return (
    <span className={'badge ms-2 ' + (severity === 'error' ? 'text-bg-danger' : 'text-bg-warning')} data-testid={'Test-LayerFlag'}>
      {t(prefix + severity)}
    </span>
  )
}

type N4LLayerCheckProps<L> = {
  issues: LayerIssue_t<L>[]
  /** Aplicar el arreglo de un problema: las capas ya corregidas */
  onFix : (layers: L[]) => void
}

/**
 * Lo que está mal en las capas antes de entrenar, cada cosa con un botón para arreglarla: los errores (impiden
 * entrenar) y los avisos (se puede, pero aprenderá peor).
 */
export default function N4LLayerCheck<L>({ issues, onFix }: N4LLayerCheckProps<L>) {
  const { t } = useTranslation()
  if (issues.length === 0) return null
  const hasErrors = issues.some(({ severity }) => severity === 'error')

  return (
    <Alert variant={hasErrors ? 'danger' : 'warning'} className={'py-2'} role={'status'} data-testid={'Test-LayerCheck'}>
      <p className={'fw-semibold mb-2'}>{t(prefix + (hasErrors ? 'title-error' : 'title-warning'))}</p>
      <ul className={'list-unstyled mb-0 d-grid gap-2'}>
        {issues.map((issue) => {
          const values = issueValues(t, issue)
          return (
            <li key={issue.kind + issue.layer}
              className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}
              data-testid={'Test-LayerCheck-' + issue.kind}>
              <span className={'small'}>
                <span className={'visually-hidden'}>{t(prefix + issue.severity)}: </span>
                {t(prefix + issue.kind + '.text', values)}
              </span>
              <Button size={'sm'}
                variant={issue.severity === 'error' ? 'danger' : 'warning'}
                className={'text-nowrap'}
                data-testid={'Test-LayerCheck-Fix'}
                onClick={() => {
                  trackEvent('layer_fix', { kind: issue.kind })
                  onFix(issue.fixed)
                }}>
                {t(prefix + issue.kind + '.fix', values)}
              </Button>
            </li>
          )
        })}
      </ul>
    </Alert>
  )
}
