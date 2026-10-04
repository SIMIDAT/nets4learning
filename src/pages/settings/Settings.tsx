import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { readConsent, saveConsent, type AnalyticsConsent_t } from '@core/analytics'
import { changeUserLanguage, LANGUAGE_OPTIONS, isSupportedLanguage } from '@core/i18n/language'
import { changeUserTheme, clearUserTheme, readSavedTheme, isTheme } from '@core/theme'
import {
  changeUserTFBackend,
  DEFAULT_TF_BACKEND,
  detectWebGPUAdapter,
  getActiveTFBackend,
  isTFBackendAvailable,
  subscribeActiveTFBackend,
  TF_BACKEND_LABELS,
  TF_BACKENDS,
  type TFBackend_t,
  type WebGPUAdapter_t,
} from '@core/tfBackend'
import { clearAllGuideProgress } from '@components/guide/guideProgress'
import { MAX_RATE, MIN_RATE, setGuideVoice, updateGuideSettings, useGuideSettings } from '@components/guide/guideSettings'
import { isSpeechSupported, useSpeech, useVoices, voicesForLanguage } from '@components/guide/speech'
import { setStepByStepEnabled, useStepByStepEnabled } from '@components/neural-network/stepByStep/stepByStepSetting'
import { deleteTrainedModels, storedModelsUsage } from '@core/training/modelStore'
import { downloadReason, setDownloadWarning, useDownloadWarning, type DownloadWarning_t } from '@core/models/downloadConsent'
import { clearOfflineData, offlineUsage } from '@core/offline/offline'
import { resetAllSettings } from './storedSettings'

const prefix = 'pages.settings.'

/** Un apartado de la configuración, con su ancla (/settings#backend…) */
function Section({ id, title, help, children }: { id: string, title: string, help?: string, children: ReactNode }) {
  return (
    <Card id={id} className={'h-100 n4l-settings-section'} data-testid={'Test-Settings-' + id}>
      <Card.Header><h2 className={'h5 mb-0'}>{title}</h2></Card.Header>
      <Card.Body>
        {help && <p className={'small text-body-secondary'}>{help}</p>}
        {children}
      </Card.Body>
    </Card>
  )
}

/**
 * Configuración general de la aplicación: idioma y tema, backend de TensorFlow.js, voz de las guías, progreso de las
 * guías, herramientas para aprender (Paso a paso), cookies y lo guardado en el navegador. Los mismos ajustes que la barra de navegación y la guía, en un
 * solo sitio y explicados.
 */
export default function Settings() {
  const { t } = useTranslation()
  return (
    <main className={'mb-4'} data-title={'Settings'} data-testid={'Test-Settings'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'text-body-secondary'}>{t(prefix + 'intro')}</p>
        <Row xs={1} lg={2} className={'g-3'}>
          <Col><AppearanceSettings /></Col>
          <Col><BackendSettings /></Col>
          <Col><DownloadSettings /></Col>
          <Col><SpeechSettings /></Col>
          <Col><TutorialSettings /></Col>
          <Col><LearningSettings /></Col>
          <Col><PrivacySettings /></Col>
          <Col><StoredDataSettings /></Col>
        </Row>
      </Container>
    </main>
  )
}

type ThemeChoice_t = 'system' | 'light' | 'dark'

function AppearanceSettings() {
  const { t, i18n } = useTranslation()
  // "Como el sistema" mientras no se elija otro (no hay nada guardado)
  const [theme, setTheme] = useState<ThemeChoice_t>(() => {
    const saved = readSavedTheme()
    return saved !== null && isTheme(saved) ? saved : 'system'
  })

  const handleChange_Theme = (choice: ThemeChoice_t) => {
    setTheme(choice)
    if (choice === 'system') clearUserTheme()
    else changeUserTheme(choice)
  }

  return (
    <Section id={'appearance'} title={t(prefix + 'appearance.title')}>
      <Form.Group controlId={'settings-language'} className={'mb-3'}>
        <Form.Label>{t(prefix + 'appearance.language')}</Form.Label>
        <Form.Select value={i18n.resolvedLanguage ?? i18n.language}
          onChange={(event) => isSupportedLanguage(event.target.value) && changeUserLanguage(i18n, event.target.value)}>
          {LANGUAGE_OPTIONS.map(({ language, label }) => <option key={language} value={language} lang={language}>{label}</option>)}
        </Form.Select>
      </Form.Group>
      <Form.Group controlId={'settings-theme'}>
        <Form.Label>{t(prefix + 'appearance.theme')}</Form.Label>
        <Form.Select value={theme} onChange={(event) => handleChange_Theme(event.target.value as ThemeChoice_t)}>
          <option value={'system'}>{t(prefix + 'appearance.theme-system')}</option>
          <option value={'light'}>{t('header.theme-light')}</option>
          <option value={'dark'}>{t('header.theme-dark')}</option>
        </Form.Select>
        <Form.Text>{t(prefix + 'appearance.theme-help')}</Form.Text>
      </Form.Group>
    </Section>
  )
}

function BackendSettings() {
  const { t } = useTranslation()
  const active = useSyncExternalStore(subscribeActiveTFBackend, getActiveTFBackend)
  const [changing, setChanging] = useState(false)
  // Que exista navigator.gpu no basta para WebGPU: se pregunta qué adaptador hay (undefined mientras no se sabe)
  const [webgpuAdapter, setWebgpuAdapter] = useState<WebGPUAdapter_t | undefined>(undefined)
  const [failed, setFailed] = useState<TFBackend_t | null>(null)

  useEffect(() => {
    if (isTFBackendAvailable('webgpu')) detectWebGPUAdapter().then(setWebgpuAdapter)
  }, [])

  const handleChange_Backend = async (backend: TFBackend_t) => {
    setChanging(true)
    setFailed(null)
    const changed = await changeUserTFBackend(backend)
    setChanging(false)
    if (!changed) setFailed(backend)
  }

  return (
    <Section id={'backend'} title={t(prefix + 'backend.title')} help={t(prefix + 'backend.help')}>
      <fieldset disabled={changing}>
        <legend className={'visually-hidden'}>{t(prefix + 'backend.title')}</legend>
        {TF_BACKENDS.map((backend) => {
          const available = isTFBackendAvailable(backend) && (backend !== 'webgpu' || webgpuAdapter !== null)
          return (
            <Form.Check key={backend} type={'radio'} id={'settings-backend-' + backend} name={'settings-backend'} className={'mb-2'}>
              <Form.Check.Input type={'radio'} checked={active === backend} disabled={!available}
                onChange={() => handleChange_Backend(backend)} />
              <Form.Check.Label className={'w-100'}>
                <span className={'fw-semibold'}>{TF_BACKEND_LABELS[backend]}</span>
                {active === backend && <Badge bg={'primary'} className={'ms-2'}>{t(prefix + 'backend.active')}</Badge>}
                {backend === DEFAULT_TF_BACKEND && <Badge bg={'secondary'} className={'ms-2'}>{t('header.backend-default')}</Badge>}
                {!available && <Badge bg={'light'} text={'dark'} className={'ms-2 border'}>{t('header.backend-unavailable')}</Badge>}
                {backend === 'webgpu' && webgpuAdapter === 'software' && <Badge bg={'warning'} text={'dark'} className={'ms-2'}>{t('header.backend-software')}</Badge>}
                <span className={'d-block small text-body-secondary'}>{t(prefix + 'backend.' + backend)}</span>
              </Form.Check.Label>
            </Form.Check>
          )
        })}
      </fieldset>
      {failed !== null &&
        <Alert variant={'warning'} className={'mt-2 mb-0 small'}>
          {t('header.backend-error', { backend: TF_BACKEND_LABELS[failed] })}. {t('header.backend-error-fallback', { backend: TF_BACKEND_LABELS[active] })}
        </Alert>}
    </Section>
  )
}

function SpeechSettings() {
  const { t, i18n } = useTranslation()
  const { voice, auto, rate, voices: chosen } = useGuideSettings()
  const language = (i18n.language || 'es').slice(0, 2)
  const voices = voicesForLanguage(useVoices(), language)
  const voiceURI = voices.some((option) => option.voiceURI === chosen[language]) ? chosen[language] : ''
  const { speak, cancel, speaking } = useSpeech(i18n.language, { voiceURI, rate })
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 2 }), [i18n.language])

  if (!isSpeechSupported()) {
    return (
      <Section id={'speech'} title={t(prefix + 'speech.title')} help={t(prefix + 'speech.help')}>
        <Alert variant={'secondary'} className={'mb-0'}>{t('guide.no-voice')}</Alert>
      </Section>
    )
  }

  return (
    <Section id={'speech'} title={t(prefix + 'speech.title')} help={t(prefix + 'speech.help')}>
      <Form.Check type={'switch'} id={'settings-speech-voice'} className={'mb-2'}
        label={t(prefix + 'speech.voice')}
        checked={voice}
        onChange={(event) => updateGuideSettings({ voice: event.target.checked })} />
      <Form.Check type={'switch'} id={'settings-speech-auto'} className={'mb-3'}
        label={t(prefix + 'speech.auto')}
        checked={auto}
        onChange={(event) => updateGuideSettings({ auto: event.target.checked })} />
      <Form.Group controlId={'settings-speech-voice-select'} className={'mb-3'}>
        <Form.Label>{t('guide.voice')}</Form.Label>
        <Form.Select value={voiceURI} disabled={!voice || voices.length === 0} onChange={(event) => setGuideVoice(language, event.target.value)}>
          <option value={''}>{t('guide.voice-auto')}</option>
          {voices.map((option) => (
            <option key={option.voiceURI} value={option.voiceURI}>
              {option.localService ? option.name : `${option.name} · ${t('guide.voice-online')}`}
            </option>
          ))}
        </Form.Select>
        <Form.Text>{voices.length === 0 ? t(prefix + 'speech.no-voices') : t(prefix + 'speech.voice-help')}</Form.Text>
      </Form.Group>
      <Form.Group controlId={'settings-speech-rate'} className={'mb-3'}>
        <Form.Label>{t(prefix + 'speech.rate', { rate: format.format(rate) })}</Form.Label>
        <Form.Range min={MIN_RATE} max={MAX_RATE} step={0.1} value={rate} disabled={!voice}
          onChange={(event) => updateGuideSettings({ rate: Number(event.target.value) })} />
      </Form.Group>
      <Button variant={'outline-primary'} disabled={!voice}
        onClick={() => (speaking ? cancel() : speak(t(prefix + 'speech.sample')))}
        data-testid={'Test-Settings-SpeechTest'}>
        {t(prefix + (speaking ? 'speech.stop' : 'speech.test'))}
      </Button>
    </Section>
  )
}

function TutorialSettings() {
  const { t } = useTranslation()
  const [guidesReset, setGuidesReset] = useState(false)

  return (
    <Section id={'tutorials'} title={t(prefix + 'tutorials.title')}>
      <p className={'small text-body-secondary'}>{t(prefix + 'tutorials.guides-help')}</p>
      <div className={'d-flex flex-wrap align-items-center gap-2'}>
        <Button variant={'outline-primary'} onClick={() => {
          clearAllGuideProgress()
          setGuidesReset(true)
        }}>{t(prefix + 'tutorials.guides-reset')}</Button>
        {guidesReset && <span className={'small text-success-emphasis'} role={'status'}>{t(prefix + 'tutorials.done')}</span>}
      </div>
    </Section>
  )
}

const DOWNLOAD_WARNINGS: DownloadWarning_t[] = ['auto', 'always', 'never']

/** Si se pregunta antes de descargar un modelo preentrenado grande, y qué dice ahora el navegador de la conexión */
function DownloadSettings() {
  const { t } = useTranslation()
  const warning = useDownloadWarning()
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean, effectiveType?: string } }).connection
  const now = downloadReason('auto', connection) ?? 'normal'
  return (
    <Section id={'downloads'} title={t(prefix + 'downloads.title')} help={t(prefix + 'downloads.help')}>
      <fieldset>
        <legend className={'visually-hidden'}>{t(prefix + 'downloads.title')}</legend>
        {DOWNLOAD_WARNINGS.map((value) => (
          <Form.Check key={value} type={'radio'} id={'settings-downloads-' + value} name={'settings-downloads'} className={'mb-2'}>
            <Form.Check.Input type={'radio'} checked={warning === value} onChange={() => setDownloadWarning(value)} />
            <Form.Check.Label className={'w-100'}>
              <span className={'fw-semibold'}>{t(prefix + 'downloads.' + value)}</span>
              <span className={'d-block small text-body-secondary'}>{t(prefix + 'downloads.' + value + '-help')}</span>
            </Form.Check.Label>
          </Form.Check>
        ))}
      </fieldset>
      <p className={'small text-body-secondary mb-0'} data-testid={'Test-Settings-Connection'}>{t(prefix + 'downloads.now-' + now)}</p>
      <OfflineUsage />
    </Section>
  )
}

/** Lo guardado para usar la aplicación sin conexión (el service worker, solo en la versión publicada), y borrarlo */
function OfflineUsage() {
  const { t, i18n } = useTranslation()
  const [usage, setUsage] = useState<{ files: number, bytes: number } | null>(null)
  const isAvailable = import.meta.env.PROD && 'serviceWorker' in navigator
  useEffect(() => {
    if (!isAvailable) return
    let isCancelled = false
    offlineUsage().then((result) => {
      if (!isCancelled) setUsage(result)
    })
    return () => { isCancelled = true }
  }, [isAvailable])
  if (!isAvailable || usage === null) return null
  const size = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(usage.bytes / 1024 / 1024)
  return (
    <div className={'mt-3 pt-3 border-top'} data-testid={'Test-Settings-Offline'}>
      <p className={'small mb-2'}>{t(prefix + 'downloads.offline', { count: usage.files, size })}</p>
      {usage.files > 0 &&
        <Button size={'sm'} variant={'outline-danger'} onClick={async () => {
          await clearOfflineData()
          setUsage({ files: 0, bytes: 0 })
        }}>{t(prefix + 'downloads.offline-delete')}</Button>}
    </div>
  )
}

/** Lo que se puede enseñar de más en las páginas para aprender: de momento, Paso a paso (oculto por defecto) */
function LearningSettings() {
  const { t } = useTranslation()
  const stepByStep = useStepByStepEnabled()
  return (
    <Section id={'learning'} title={t(prefix + 'learning.title')} help={t(prefix + 'learning.help')}>
      <Form.Check type={'switch'} id={'settings-learning-step-by-step'} className={'mb-2'}
        label={t(prefix + 'learning.step-by-step')}
        checked={stepByStep}
        onChange={(event) => setStepByStepEnabled(event.target.checked)} />
      <p className={'small text-body-secondary mb-0'}>{t(prefix + 'learning.step-by-step-help')}</p>
    </Section>
  )
}

function PrivacySettings() {
  const { t } = useTranslation()
  const [consent, setConsent] = useState<AnalyticsConsent_t | null>(readConsent)

  const handleChange_Consent = (accepted: boolean) => {
    const decision = accepted ? 'accepted' : 'rejected'
    saveConsent(decision, 'settings')
    setConsent(decision)
  }

  return (
    <Section id={'privacy'} title={t(prefix + 'privacy.title')} help={t(prefix + 'privacy.help')}>
      <Form.Check type={'switch'} id={'settings-privacy-analytics'} className={'mb-2'}
        label={t(prefix + 'privacy.analytics')}
        checked={consent === 'accepted'}
        onChange={(event) => handleChange_Consent(event.target.checked)} />
      <p className={'small mb-2'} role={'status'}>
        {t(prefix + 'privacy.status-' + (consent ?? 'undecided'))}
      </p>
      <Link to={'/terms-and-conditions#cookies'} className={'small'}>{t(prefix + 'privacy.more')}</Link>
    </Section>
  )
}

/** Los modelos entrenados guardados en el navegador: cuántos son, cuánto ocupan y un botón para borrarlos */
function StoredModelsUsage() {
  const { t, i18n } = useTranslation()
  const [usage, setUsage] = useState<{ count: number, bytes: number } | null>(null)
  useEffect(() => {
    let isCancelled = false
    storedModelsUsage().then((result) => {
      if (!isCancelled) setUsage(result)
    })
    return () => { isCancelled = true }
  }, [])
  if (usage === null) return null
  // En kB si no llega a 1 MB: los modelos pequeños (Iris) ocupan unos pocos kB
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 })
  const size = usage.bytes < 1024 * 1024 ? number.format(usage.bytes / 1024) + ' kB' : number.format(usage.bytes / 1024 / 1024) + ' MB'
  return (
    <div className={'d-flex flex-wrap align-items-center gap-2 mb-3'} data-testid={'Test-Settings-StoredModels'}>
      <span className={'small'}>{t(prefix + 'data.models', { count: usage.count, size })}</span>
      {usage.count > 0 &&
        <Button size={'sm'} variant={'outline-danger'} onClick={async () => {
          await deleteTrainedModels()
          setUsage({ count: 0, bytes: 0 })
        }}>{t(prefix + 'data.models-delete')}</Button>}
    </div>
  )
}

function StoredDataSettings() {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)

  const handleClick_Reset = async () => {
    await resetAllSettings()
    // Para que todo vuelva a su valor por defecto (idioma del navegador, tema del sistema…)
    window.location.reload()
  }

  return (
    <Section id={'data'} title={t(prefix + 'data.title')} help={t(prefix + 'data.help')}>
      <StoredModelsUsage />
      {!confirming && <Button variant={'outline-danger'} onClick={() => setConfirming(true)}>{t(prefix + 'data.reset')}</Button>}
      {confirming &&
        <Alert variant={'danger'} className={'mb-0'}>
          <p className={'mb-2'}>{t(prefix + 'data.confirm')}</p>
          <div className={'d-flex gap-2'}>
            <Button variant={'danger'} onClick={handleClick_Reset} data-testid={'Test-Settings-ResetConfirm'}>{t(prefix + 'data.confirm-button')}</Button>
            <Button variant={'outline-secondary'} onClick={() => setConfirming(false)}>{t(prefix + 'data.cancel')}</Button>
          </div>
        </Alert>}
    </Section>
  )
}
