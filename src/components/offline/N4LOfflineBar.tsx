import { useTranslation } from 'react-i18next'

import { useIsOnline } from '@core/offline/offline'

/** Sin conexión: una franja bajo la barra de navegación que dice qué se puede seguir usando */
export default function N4LOfflineBar() {
  const { t } = useTranslation()
  const isOnline = useIsOnline()
  if (isOnline) return null
  return (
    <div className={'n4l-offline-bar text-bg-warning small text-center py-1 px-3'} role={'status'} data-testid={'Test-OfflineBar'}>
      {t('offline.bar')}
    </div>
  )
}
