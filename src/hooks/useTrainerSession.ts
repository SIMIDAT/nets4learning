import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { TASKS_TYPE_V } from '@/TASKS'
import alertHelper from '@utils/alertHelper'
import { parseSession, SessionError, type TrainingSession_t } from '@core/session/trainingSession'
import { useSharedSession } from '@hooks/useSharedSession'

/**
 * La configuración (capas e hiperparámetros) de una página de entrenamiento: importarla desde un fichero o desde un
 * enlace compartido, con los mismos avisos en las tres. Cada página dice cómo se aplica (`apply`; puede lanzar
 * SessionError si las capas no son de su tipo) y cuándo está lista para recibirla (`ready`: ya ha puesto sus capas por
 * defecto). `sessionVersion` cambia al importar, para volver a montar los editores con los valores nuevos.
 */
export function useTrainerSession(task: TASKS_TYPE_V, ready: boolean, apply: (session: TrainingSession_t) => void) {
  const { t } = useTranslation()
  const [sessionVersion, setSessionVersion] = useState(0)

  const importSession = async (text: string) => {
    try {
      apply(parseSession(text, task))
      setSessionVersion((version) => version + 1)
      await alertHelper.alertSuccess(t('session.imported'))
    } catch (error) {
      await alertHelper.alertError(t(error instanceof SessionError ? error.i18nKey : 'session.error-not-session'))
    }
  }
  useSharedSession(ready, importSession)

  return { sessionVersion, importSession }
}
