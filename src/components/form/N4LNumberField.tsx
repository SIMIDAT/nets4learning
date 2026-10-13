import { useId, useState, type ReactNode } from 'react'
import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type N4LNumberFieldProps = {
  controlId        : string
  label            : ReactNode
  help?            : ReactNode
  /** El valor que se usa (siempre válido) */
  value            : number
  min              : number
  max?             : number
  /** Solo se recibe un valor dentro de [min, max] */
  onChange         : (value: number) => void
  labelClassName?  : string
  controlClassName?: string
  className?       : string
  /** Para las guías (data-guide) */
  guide?           : string
  disabled?        : boolean
}

/**
 * Un campo para un número entero entre `min` y `max` (WCAG 3.3.1, 3.3.3). Se puede borrar y escribir otro número
 * tranquilamente: lo que no vale no se recorta en silencio, sino que se dice junto al campo qué se puede escribir y qué
 * valor se sigue usando mientras tanto (`aria-invalid` y `aria-describedby`; el lector lo oye al cambiar).
 */
export default function N4LNumberField({ controlId, label, help, value, min, max, onChange, labelClassName, controlClassName, className, guide, disabled = false }: N4LNumberFieldProps) {
  const { t } = useTranslation()
  const prefix = 'form.number.'
  const [text, setText] = useState(String(value))
  // Si el valor cambia desde fuera (otra sesión, un botón que lo arregla…), el campo lo enseña
  const [shown, setShown] = useState(value)
  if (shown !== value) {
    setShown(value)
    if (Number(text) !== value) setText(String(value))
  }

  const parsed = text.trim() === '' ? Number.NaN : Number(text)
  const isValid = Number.isInteger(parsed) && parsed >= min && (max === undefined || parsed <= max)
  const error = isValid ? null : `${t(prefix + (max === undefined ? 'at-least' : 'range'), { min, max })} ${t(prefix + 'in-use', { value })}`

  const helpId = useId()
  const errorId = useId()
  const describedBy = [help !== undefined ? helpId : null, error !== null ? errorId : null].filter((id) => id !== null).join(' ')

  return (
    <Form.Group className={className} controlId={controlId} data-guide={guide}>
      <Form.Label className={labelClassName}>{label}</Form.Label>
      <Form.Control type={'number'} inputMode={'numeric'} min={min} max={max} step={1} className={controlClassName} disabled={disabled}
        value={text} isInvalid={error !== null} aria-invalid={error !== null} aria-describedby={describedBy || undefined}
        onChange={(event) => {
          setText(event.target.value)
          const next = Number(event.target.value)
          if (event.target.value.trim() !== '' && Number.isInteger(next) && next >= min && (max === undefined || next <= max)) {
            setShown(next)
            onChange(next)
          }
        }} />
      {/* Siempre en la página (vacío si no hay error): una región aria-live que aparece con su texto no siempre se lee */}
      <div id={errorId} className={error !== null ? 'invalid-feedback d-block' : 'visually-hidden'} aria-live={'polite'}
        data-testid={'Test-NumberField-Error'}>
        {error}
      </div>
      {help !== undefined && <Form.Text id={helpId} className={'text-muted'}>{help}</Form.Text>}
    </Form.Group>
  )
}
