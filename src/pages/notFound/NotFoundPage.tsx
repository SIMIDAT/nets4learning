import styles from './NotFoundPage.module.css'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function NotFoundPage () {
  return <>
    <div
      style={{
        backgroundColor: '#222',
        color          : '#fff',
        height         : 'calc(100vh - 56px)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
      }}
      data-testid={'Test-NotFoundPage'}
    >
      <div className="text-center">
        <h1 className={`display-1 fw-bold ${styles.title_404}`}>404</h1>
        <h4 className={`fw-bold ${styles.subtitle_404}`}>
          <Trans>Error 404</Trans>
        </h4>
        <p className="lead mt-4">
          <Link className="btn btn-outline-light btn-lg" to="/" style={{ transition: '0.3s' }}>
            <Trans>Return to Home</Trans>
          </Link>
        </p>
      </div>
    </div>
  </>
}
