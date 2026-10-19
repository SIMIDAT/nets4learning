import { useEffect, useId, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type N4LConfirmButtonProps = {
  /** Lo que dice el botón («Borrar los modelos») */
  label       : string
  /** La pregunta antes de hacerlo, con lo que se pierde («Se borrarán 3 modelos. No se puede deshacer.») */
  question    : string
  /** El botón que lo hace («Borrar») */
  confirmLabel: string
  onConfirm   : () => void | Promise<void>
  size?       : 'sm' | 'lg'
  /** Nombre accesible del botón, si lo que dice no basta (varios «Quitar» en la página) */
  ariaLabel?  : string
  testId?     : string
}

/**
 * Un botón para algo que no se puede deshacer (WCAG 3.3.4): antes de hacerlo pregunta en el sitio, sin ventanas, qué se
 * va a perder. El foco va a «Cancelar» (lo que no rompe nada) y, al cancelar, vuelve al botón
 */
export default function N4LConfirmButton({ label, question, confirmLabel, onConfirm, size = 'sm', ariaLabel, testId }: N4LConfirmButtonProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const questionId = useId()
  const cancel_ref = useRef<HTMLButtonElement>(null)
  const button_ref = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (confirming) cancel_ref.current?.focus()
    else if (returnFocus.current) {
      returnFocus.current = false
      button_ref.current?.focus()
    }
  }, [confirming])

  if (!confirming) {
    return (
      <Button ref={button_ref} size={size} variant={'outline-danger'} aria-label={ariaLabel} onClick={() => setConfirming(true)} data-testid={testId}>
        {label}
      </Button>
    )
  }
  return (
    <div role={'group'} aria-labelledby={questionId} className={'d-flex flex-wrap align-items-center gap-2'}>
      <span id={questionId} className={'small'}>{question}</span>
      <Button size={size} variant={'danger'} data-testid={testId === undefined ? undefined : testId + '-Confirm'}
        onClick={async () => {
          await onConfirm()
          setConfirming(false)
        }}>
        {confirmLabel}
      </Button>
      <Button ref={cancel_ref} size={size} variant={'outline-secondary'} onClick={() => {
        returnFocus.current = true
        setConfirming(false)
      }}>
        {t('form.cancel')}
      </Button>
    </div>
  )
}
