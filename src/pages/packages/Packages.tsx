import { Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import N4LLocalPackages from '@components/n4l/N4LLocalPackages'

/** Los paquetes .n4l del usuario: abrir uno y los que ya ha guardado en este navegador, con todas sus tareas */
export default function Packages() {
  const { t } = useTranslation()
  return (
    <main className={'mb-3'} data-title={'Packages'}>
      <Container id={'Packages'} className={'mt-3 mb-3 n4l-container-wide'}>
        <h1 className={'mt-3'}>{t('n4l.local.title')}</h1>
        <p className={'lead'}>{t('n4l.local.text')}</p>
        <N4LLocalPackages />
      </Container>
    </main>
  )
}
