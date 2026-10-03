import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Container } from 'react-bootstrap'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import N4LProgressBar from '@components/loading/N4LProgressBar'
import { LEARNING_CHALLENGES, LEARNING_STEPS, nextStep, resetLearningPath, setStepDone, startLearningPath, useLearningPath } from '@core/learning/learningPath'

const prefix = 'pages.learn.'

/**
 * «Empieza aquí»: el recorrido para quien llega por primera vez, paso a paso y en orden (de probar una red ya
 * entrenada a explicar sus predicciones). Cada paso lleva a su página y se marca solo al hacerlo.
 */
export default function Learn() {
  const { t, i18n } = useTranslation()
  const { done, challenges } = useLearningPath()
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])
  // Desde que se entra aquí, al completar un paso en otra página se avisa
  useEffect(() => startLearningPath(), [])
  const passed = LEARNING_CHALLENGES.filter(({ id }) => challenges[id] !== undefined).length

  const next = nextStep(done)
  const count = LEARNING_STEPS.filter(({ id }) => done.includes(id)).length

  return (
    <main className={'mb-4'} data-title={'Learn'} data-testid={'Test-Learn'}>
      <Container>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'lead'}>{t(prefix + 'intro')}</p>

        <div className={'mb-4'}>
          <div className={'d-flex justify-content-between small mb-1'}>
            <span data-testid={'Test-Learn-Progress'}>{t(prefix + 'progress', { count, total: LEARNING_STEPS.length })}</span>
          </div>
          <N4LProgressBar now={(count / LEARNING_STEPS.length) * 100} variant={'success'} label={t(prefix + 'progress', { count, total: LEARNING_STEPS.length })} />
        </div>

        {next === undefined && (
          <Alert variant={'success'} data-testid={'Test-Learn-Finished'}>
            <p className={'fw-semibold mb-1'}>{t(prefix + 'finished.title')}</p>
            <p className={'mb-0'}>{t(prefix + 'finished.text')}</p>
          </Alert>
        )}

        <ol className={'list-unstyled d-grid gap-3'}>
          {LEARNING_STEPS.map(({ id, to }, index) => {
            const isDone = done.includes(id)
            const isNext = next?.id === id
            return (
              <li key={id} data-testid={'Test-Learn-Step-' + id} data-done={isDone}>
                <Card className={isNext ? 'border-primary border-2' : isDone ? 'border-success' : undefined}>
                  <Card.Body className={'d-flex gap-3 align-items-start'}>
                    <span className={'n4l-learn-number ' + (isDone ? 'text-bg-success' : isNext ? 'text-bg-primary' : 'text-bg-secondary')} aria-hidden={true}>
                      {isDone ? '✓' : index + 1}
                    </span>
                    <div className={'flex-grow-1'} style={{ minWidth: 0 }}>
                      <h2 className={'h5 mb-1'}>
                        <span className={'visually-hidden'}>{t(prefix + 'step', { number: index + 1 })}: </span>
                        {t(prefix + 'steps.' + id + '.title')}
                        {isDone && <Badge bg={'success'} className={'ms-2 align-middle'}>{t(prefix + 'done')}</Badge>}
                        {isNext && <Badge bg={'primary'} className={'ms-2 align-middle'}>{t(prefix + 'next')}</Badge>}
                      </h2>
                      <p className={'mb-2'}>{t(prefix + 'steps.' + id + '.text')}</p>
                      <div className={'d-flex flex-wrap align-items-center gap-2'}>
                        <Link to={to} className={'btn btn-sm ' + (isNext ? 'btn-primary' : 'btn-outline-primary')} data-testid={'Test-Learn-Go-' + id}>
                          {t(prefix + (isDone ? 'again' : 'go'))}
                        </Link>
                        <Button variant={'link'} size={'sm'} className={'p-0'} onClick={() => setStepDone(id, !isDone)}>
                          {t(prefix + (isDone ? 'mark-undone' : 'mark-done'))}
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ol>

        <section id={'challenges'} className={'mt-5 mb-4'} aria-labelledby={'n4l-learn-challenges'} data-testid={'Test-Learn-Challenges'}>
          <h2 id={'n4l-learn-challenges'}>{t(prefix + 'challenges.title')}</h2>
          <p>{t(prefix + 'challenges.intro')}</p>
          <p className={'small'} data-testid={'Test-Learn-Challenges-Progress'}>{t(prefix + 'challenges.progress', { count: passed, total: LEARNING_CHALLENGES.length })}</p>
          <ul className={'list-unstyled d-grid gap-3'}>
            {LEARNING_CHALLENGES.map(({ id, to }) => {
              const value = challenges[id]
              const isPassed = value !== undefined
              return (
                <li key={id} data-testid={'Test-Learn-Challenge-' + id} data-passed={isPassed}>
                  <Card className={isPassed ? 'border-success' : undefined}>
                    <Card.Body>
                      <h3 className={'h5 mb-1'}>
                        {t(prefix + 'challenges.' + id + '.title')}
                        {isPassed && <Badge bg={'success'} className={'ms-2 align-middle'}>{t(prefix + 'challenges.passed')}</Badge>}
                      </h3>
                      <p className={'mb-2'}>{t(prefix + 'challenges.' + id + '.goal')}</p>
                      {isPassed && id !== 'regression-good' && (
                        <p className={'small text-success-emphasis mb-2'}>{t(prefix + 'challenges.result', { value: percent.format(value) })}</p>
                      )}
                      <details className={'mb-2 small'}>
                        <summary>{t(prefix + 'challenges.hint')}</summary>
                        <p className={'mb-0 mt-1'}>{t(prefix + 'challenges.' + id + '.hint')}</p>
                      </details>
                      <Link to={to} className={'btn btn-sm btn-outline-primary'}>
                        {t(prefix + (isPassed ? 'challenges.again' : 'challenges.go'))}
                      </Link>
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>

        {(count > 0 || passed > 0) && (
          <div className={'d-flex flex-wrap align-items-center gap-2'}>
            {!isConfirmingReset && <Button variant={'outline-secondary'} size={'sm'} onClick={() => setIsConfirmingReset(true)}>{t(prefix + 'reset')}</Button>}
            {isConfirmingReset && <>
              <span className={'small'}>{t(prefix + 'reset-confirm')}</span>
              <Button variant={'danger'} size={'sm'} onClick={() => {
                resetLearningPath()
                startLearningPath()
                setIsConfirmingReset(false)
              }}>{t(prefix + 'reset-yes')}</Button>
              <Button variant={'outline-secondary'} size={'sm'} onClick={() => setIsConfirmingReset(false)}>{t(prefix + 'reset-no')}</Button>
            </>}
          </div>
        )}
      </Container>
    </main>
  )
}
