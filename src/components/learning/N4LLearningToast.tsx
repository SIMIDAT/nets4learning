import { Toast, ToastContainer } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { dismissJustCompleted, LEARNING_STEPS, nextStep, useJustCompleted, useLearningPath } from '@core/learning/learningPath'

/** Cuánto se ve el aviso */
const DELAY_MS = 9000

/**
 * El aviso al completar un paso de «Empieza aquí» o superar un reto en cualquier página (si ya se ha entrado en
 * /learn): qué se ha hecho y qué viene después. En /learn no hace falta: ya se ve allí.
 */
export default function N4LLearningToast() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const completed = useJustCompleted()
  const { done } = useLearningPath()
  if (completed === null || pathname === '/learn') return null

  const prefix = 'pages.learn.'
  const isChallenge = completed.type === 'challenge'
  const next = nextStep(done)
  const title = isChallenge
    ? t(prefix + 'toast.challenge')
    : t(prefix + 'toast.title', { number: LEARNING_STEPS.findIndex(({ id }) => id === completed.id) + 1, total: LEARNING_STEPS.length })
  const link = isChallenge
    ? t(prefix + 'toast.challenges')
    : next === undefined ? t(prefix + 'toast.finished') : t(prefix + 'toast.next', { title: t(prefix + 'steps.' + next.id + '.title') })

  return (
    <ToastContainer position={'bottom-start'} className={'p-3 position-fixed'} style={{ zIndex: 1080 }}>
      <Toast onClose={dismissJustCompleted} delay={DELAY_MS} autohide={true} bg={'success-subtle'}
        role={'status'} aria-live={'polite'} aria-atomic={true} data-testid={'Test-LearningToast'}>
        <Toast.Header closeLabel={t(prefix + 'toast.close')}>
          <strong className={'me-auto'}>{title}</strong>
        </Toast.Header>
        <Toast.Body>
          <p className={'mb-1 fw-semibold'}>{t(prefix + (isChallenge ? 'challenges.' : 'steps.') + completed.id + '.title')}</p>
          <Link to={isChallenge ? '/learn#challenges' : '/learn'} onClick={dismissJustCompleted}>{link}</Link>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  )
}
