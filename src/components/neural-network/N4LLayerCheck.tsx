import { useEffect, useEffectEvent, useRef } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import type { LayerIssue_t } from '@core/nn-utils/checkLayers'
import { trackEvent } from '@core/analytics'
import { announce } from '@core/a11y/announce'
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

  // Al cambiar una capa, el lector de pantalla oye lo que acaba de aparecer y cuándo ya no queda nada (WCAG 4.1.3). El
  // aviso aparece a la vez que su texto: como región aria-live no siempre se anunciaría
  const texts = issues.map((issue) => ({ key: issue.kind + issue.layer, text: `${t(prefix + issue.severity)}: ${t(prefix + issue.kind + '.text', issueValues(t, issue))}` }))
  const announcedKeys = useRef<string[]>([])
  const announceChanges = useEffectEvent(() => {
    const previous = announcedKeys.current
    announcedKeys.current = texts.map(({ key }) => key)
    const added = texts.filter(({ key }) => !previous.includes(key))
    if (added.length > 0) announce(added.map(({ text }) => text).join('. '))
    else if (texts.length === 0 && previous.length > 0) announce(t(prefix + 'all-fixed'))
  })
  // Solo cuando cambian los problemas (no, p. ej., al cambiar de idioma)
  const textsKey = texts.map(({ key }) => key).join('|')
  useEffect(() => announceChanges(), [textsKey])

  if (issues.length === 0) return null
  const hasErrors = issues.some(({ severity }) => severity === 'error')

  return (
    <Alert variant={hasErrors ? 'danger' : 'warning'} className={'py-2'} role={undefined} data-testid={'Test-LayerCheck'}>
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
