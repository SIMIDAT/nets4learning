import { ProgressBar, type ProgressBarProps } from 'react-bootstrap'

type N4LProgressBarProps = Omit<ProgressBarProps, 'label' | 'aria-label'> & {
  /** Lo que dice el lector de pantalla de la barra (no se ve) */
  label: string
}

/**
 * Barra de progreso con nombre para los lectores de pantalla. ProgressBar pone aria-label en su envoltorio, donde no
 * vale (no tiene rol), y deja sin nombre la barra (role="progressbar"); como barra hija, la etiqueta llega a la barra.
 */
export default function N4LProgressBar({ label, className, ...props }: N4LProgressBarProps) {
  return (
    <ProgressBar className={className}>
      <ProgressBar {...props} aria-label={label} />
    </ProgressBar>
  )
}
