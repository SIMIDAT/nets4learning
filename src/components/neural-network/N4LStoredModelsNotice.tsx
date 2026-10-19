import { useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type N4LStoredModelsNoticeProps = {
  /** Cuántos modelos se han recuperado al entrar (0: no se enseña nada) */
  count  : number
  /** Borra los modelos guardados de este conjunto y los quita de la tabla */
  onClear: () => void | Promise<void>
}

/**
 * Aviso de que los modelos de la tabla vienen de antes (guardados en el navegador para no perderlos al recargar), con
 * la opción de borrarlos. Borrar pide confirmación: también se quitan de la tabla.
 */
export default function N4LStoredModelsNotice({ count, onClear }: N4LStoredModelsNoticeProps) {
  const { t } = useTranslation()
  const prefix = 'stored-models.'
  const [confirming, setConfirming] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  if (count === 0 || dismissed) return null

  return (
    <Alert variant={'info'} className={'small d-flex flex-wrap align-items-center gap-2 py-2'} dismissible={!confirming}
      onClose={() => setDismissed(true)} data-testid={'Test-StoredModels'}>
      <span className={'flex-grow-1'}>{t(prefix + (confirming ? 'confirm' : 'restored'), { count })}</span>
      {confirming
        ? <>
          <Button size={'sm'} variant={'danger'} data-testid={'Test-StoredModels-Confirm'}
            onClick={async () => {
              await onClear()
              setConfirming(false)
              setDismissed(true)
            }}>{t(prefix + 'delete')}</Button>
          <Button size={'sm'} variant={'outline-secondary'} onClick={() => setConfirming(false)}>{t(prefix + 'cancel')}</Button>
        </>
        : <Button size={'sm'} variant={'outline-danger'} onClick={() => setConfirming(true)} data-testid={'Test-StoredModels-Delete'}>
          {t(prefix + 'delete-ask')}
        </Button>}
    </Alert>
  )
}
