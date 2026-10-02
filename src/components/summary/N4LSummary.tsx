import { Suspense, useState } from 'react'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

type N4LSummaryProps = {
  title    : React.JSX.Element | string;
  info?    : React.JSX.Element | string;
  children?: React.ReactNode;
}

/**
 * Un apartado plegable (`<details>`). Su contenido se monta la primera vez que se abre: cerrado no se ve, y así no se
 * pinta (ni se descarga, si es perezoso) lo que quizá nunca se abra, como las tablas de Plotly de las descripciones.
 */
export default function N4LSummary({ title, info = <></>, children = <></> }: N4LSummaryProps) {
  const [opened, setOpened] = useState(false)
  return (
    <details onToggle={(event) => event.currentTarget.open && setOpened(true)}>
      <summary className={'n4l-summary-1-25'}>{title}</summary>
      <main>{opened && <Suspense fallback={<WaitingPlaceholder />}>{info} {children}</Suspense>}</main>
    </details>
  )
}
