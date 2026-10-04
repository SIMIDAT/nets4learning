import { OverlayTrigger, Popover } from 'react-bootstrap'

/** Término con su definición al pasar el ratón o al llegar con el teclado */
export default function N4LHelpTerm({ label, help }: { label: string, help: string }) {
  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement={'top'} overlay={<Popover><Popover.Body>{help}</Popover.Body></Popover>}>
      <span className={'n4l-help-term'} tabIndex={0}>{label}</span>
    </OverlayTrigger>
  )
}
