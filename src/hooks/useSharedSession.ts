import { useEffect, useEffectEvent, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import alertHelper from '@utils/alertHelper'
import { SessionError, sessionFromHash } from '@core/session/trainingSession'

/**
 * La configuración que llega en un enlace compartido (#n4l=… en la dirección): se importa una vez, cuando la página ya
 * ha puesto sus capas por defecto (`ready`), y se quita de la dirección para que recargar no la vuelva a aplicar.
 */
export function useSharedSession(ready: boolean, onImport: (text: string) => void) {
  const { hash, pathname, search } = useLocation()
  const navigate = useNavigate()
  const applied = useRef(false)
  const { t } = useTranslation()
  const importSession = useEffectEvent(onImport)
  const showError = useEffectEvent((i18nKey: string) => { void alertHelper.alertError(t(i18nKey)) })

  useEffect(() => {
    if (!ready || applied.current || hash === '') return
    let isCancelled = false
    sessionFromHash(hash).then((text) => {
      if (isCancelled || text === null) return
      applied.current = true
      navigate({ pathname, search }, { replace: true })
      importSession(text)
    }, (error: unknown) => {
      if (isCancelled) return
      applied.current = true
      navigate({ pathname, search }, { replace: true })
      showError(error instanceof SessionError ? error.i18nKey : 'session.error-link')
    })
    return () => { isCancelled = true }
  }, [ready, hash, pathname, search, navigate])
}
