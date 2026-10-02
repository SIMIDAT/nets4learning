import { lazy, Suspense, useEffect } from 'react'
import styles from './NotFoundPage.module.css'
import { Trans } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { trackEvent } from '@core/analytics'

// Es decoración: tsParticles va en su propio fragmento y el 404 se ve sin esperar a que llegue
const NeuralNetworkBackground = lazy(() => import('./NeuralNetworkBackground'))

export default function NotFoundPage () {
  // La ruta que no existe (App la pasa al redirigir aquí): para encontrar enlaces rotos
  const missingPath = (useLocation().state as { missingPath?: string } | null)?.missingPath
  useEffect(() => {
    if (missingPath !== undefined) trackEvent('not_found', { missing_path: missingPath })
  }, [missingPath])

  return <>
    <main
      className={`d-flex align-items-center justify-content-center ${styles.page}`}
      data-testid={'Test-NotFoundPage'}
    >
      <Suspense fallback={null}>
        <NeuralNetworkBackground />
      </Suspense>
      <div className={`text-center ${styles.content}`}>
        <h1 className={`display-1 fw-bold ${styles.title_404}`}>404</h1>
        <h2 className={`fw-bold ${styles.subtitle_404}`}>
          <Trans i18nKey={'pages.not-found.title'} />
        </h2>
        <p className="lead mt-4">
          <Link className="btn btn-outline-primary btn-lg" to="/">
            <Trans i18nKey={'pages.not-found.return-home'} />
          </Link>
        </p>
      </div>
    </main>
  </>
}
