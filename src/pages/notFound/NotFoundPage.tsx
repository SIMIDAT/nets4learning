import styles from './NotFoundPage.module.css'
import { Trans } from 'react-i18next'
import { Link } from 'react-router'

export default function NotFoundPage () {
  return <>
    <div
      className={'d-flex align-items-center justify-content-center'}
      style={{ minHeight: 'calc(100vh - 56px)' }}
      data-testid={'Test-NotFoundPage'}
    >
      <div className="text-center">
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
    </div>
  </>
}
