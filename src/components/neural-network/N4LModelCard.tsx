import { Card } from 'react-bootstrap'

type N4LModelCardProps = {
  /** El nombre del modelo */
  title    : React.ReactNode
  /** Botones (p. ej. el resumen de la red), encima de la descripción */
  actions? : React.ReactNode
  children?: React.ReactNode
}

/**
 * La tarjeta del modelo de las páginas para probar modelos ya entrenados: su nombre, sus botones y su descripción. Va
 * dentro de N4LModelAside, que la deja fija al bajar en pantallas grandes.
 */
export default function N4LModelCard({ title, actions, children }: N4LModelCardProps) {
  return (
    <Card className={'border-info'} data-guide={'model'} data-testid={'Test-ModelCard'}>
      <Card.Header><h2 className={'h5 mb-0'}>{title}</h2></Card.Header>
      <Card.Body className={'n4l-model-description'}>
        {actions && <div className={'d-grid gap-2 mb-3'}>{actions}</div>}
        {children}
      </Card.Body>
    </Card>
  )
}
