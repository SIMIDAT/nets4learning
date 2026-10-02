import './N4LMaximize.css'
import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Fullscreen, FullscreenExit } from 'react-bootstrap-icons'

type N4LMaximizeButtonProps = {
  /** De useMaximize */
  maximized: boolean
  onToggle : () => void
  disabled?: boolean
}

/** Botón de la cabecera de una tarjeta que la maximiza (toda la pantalla) y la devuelve a su sitio */
export default function N4LMaximizeButton({ maximized, onToggle, disabled = false }: N4LMaximizeButtonProps) {
  const { t } = useTranslation()
  const label = t(maximized ? 'ui.minimize' : 'ui.maximize')
  const Icon = maximized ? FullscreenExit : Fullscreen
  return (
    <Button size={'sm'}
      variant={'outline-secondary'}
      className={'n4l-maximize-button'}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onToggle}
      data-testid={'Test-MaximizeButton'}>
      <Icon aria-hidden={true} />
    </Button>
  )
}
