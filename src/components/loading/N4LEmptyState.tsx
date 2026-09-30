import { Trans } from 'react-i18next'

/**
 * Aviso de que falta un paso del usuario (subir un fichero, procesar los datos, entrenar un modelo…) para ver el
 * contenido de la tarjeta. Para una carga en curso se usa WaitingPlaceholder.
 */
export default function N4LEmptyState({ i18nKey }: { i18nKey: string }) {
  return (
    <p className={'n4l-empty-state'}>
      <Trans i18nKey={i18nKey} />
    </p>
  )
}
