import { useMemo, useState } from 'react'
import { Button, ButtonGroup, Card } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'
import { kerasCode, tfjsCode, type ModelCode_t } from '@core/nn-utils/modelCode'

type Language_t = 'tfjs' | 'keras'

const LANGUAGES: Array<{ id: Language_t, label: string }> = [
  { id: 'tfjs', label: 'TensorFlow.js (JavaScript)' },
  { id: 'keras', label: 'Keras (Python)' },
]

/**
 * «Ver el código»: la red que se ha diseñado en el editor, escrita en TensorFlow.js o en Keras (Python), igual que la
 * entrena la aplicación. Plegada al principio; se actualiza al cambiar las capas o los hiperparámetros. `spec`: null
 * mientras no hay datos (no se sabe cuántas entradas tiene la red)
 */
export default function N4LModelCode({ spec, task }: { spec: ModelCode_t | null, task: string }) {
  const { t } = useTranslation()
  const prefix = 'model-code.'
  const [language, setLanguage] = useState<Language_t>('tfjs')
  const [copied, setCopied] = useState(false)
  const code = useMemo(() => (spec === null ? '' : language === 'tfjs' ? tfjsCode(spec) : kerasCode(spec)), [spec, language])
  if (spec === null) return null

  const handleClick_Copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      trackEvent('model_code', { action: 'copy', language, task })
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card data-testid={'Test-ModelCode'}>
      <details onToggle={(event) => { if ((event.target as HTMLDetailsElement).open) trackEvent('model_code', { action: 'open', language, task }) }}>
        <summary className={'card-header n4l-model-code-summary'}>
          <span className={'fw-semibold'}>{t(prefix + 'title')}</span>
          <span className={'d-block small text-body-secondary'}>{t(prefix + 'summary')}</span>
        </summary>
        <Card.Body>
          <div className={'d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'}>
            <ButtonGroup aria-label={t(prefix + 'language')}>
              {LANGUAGES.map(({ id, label }) => (
                <Button key={id} size={'sm'} variant={language === id ? 'primary' : 'outline-primary'} aria-pressed={language === id}
                  onClick={() => {
                    setLanguage(id)
                    setCopied(false)
                  }}>
                  {label}
                </Button>
              ))}
            </ButtonGroup>
            <Button size={'sm'} variant={'outline-secondary'} onClick={handleClick_Copy} data-testid={'Test-ModelCode-Copy'}>
              {t(prefix + (copied ? 'copied' : 'copy'))}
            </Button>
          </div>
          <span className={'visually-hidden'} role={'status'}>{copied ? t(prefix + 'copied') : ''}</span>
          <pre className={'n4l-code bg-body-tertiary border rounded p-3 mb-2'} tabIndex={0} role={'region'} lang={'en'}
            aria-label={t(prefix + 'code', { language: LANGUAGES.find(({ id }) => id === language)!.label })}
            data-testid={'Test-ModelCode-Code'}><code>{code}</code></pre>
          <p className={'small text-body-secondary mb-0'}>{t(prefix + 'help-' + language)}</p>
        </Card.Body>
      </details>
    </Card>
  )
}
