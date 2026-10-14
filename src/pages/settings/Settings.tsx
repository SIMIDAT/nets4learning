import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Nav, Row, Tab } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'

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
import { clearOfflinePages, clearSavedModel, clearSavedModels, offlineUsage, type SavedModel_t } from '@core/offline/offline'
import { resetAllSettings } from './storedSettings'
import N4LConfirmButton from '@components/form/N4LConfirmButton'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { TEXT_SIZES, updateDisplaySettings, useDisplaySettings, type DisplaySettings_t } from '@core/a11y/displaySettings'

const prefix = 'pages.settings.'

/** El contenido de un apartado de la configuración (su pestaña es el ancla: /settings#backend…) */
function Section({ id, title, help, children }: { id: string, title: string, help?: string, children: ReactNode }) {
  return (
    <Card className={'n4l-settings-section'} data-testid={'Test-Settings-' + id}>
      {/* En el móvil, el ancla del apartado (/settings#privacy) y lo que recibe el foco al abrirlo */}
      <Card.Header><h2 id={headingId(id)} className={'h5 mb-0'} tabIndex={-1} data-hash-target={id}>{title}</h2></Card.Header>
      <Card.Body>
        {help && <p className={'small text-body-secondary'}>{help}</p>}
        {children}
      </Card.Body>
    </Card>
  )
}

/**
 * Configuración general de la aplicación: idioma y tema, accesibilidad, backend de TensorFlow.js, voz de las guías, progreso de las
 * guías, herramientas para aprender (Paso a paso), cookies y lo guardado en el navegador. Los mismos ajustes que la barra de navegación y la guía, en un
 * solo sitio y explicados.
 */
export default function Settings() {
  const { t } = useTranslation()
  const { hash } = useLocation()
  // El apartado abierto va en la dirección (/settings#privacy): los enlaces llevan directos a él
  const requested = decodeURIComponent(hash.slice(1))
  const section = SECTIONS.some(({ id }) => id === requested) ? requested : null
  // En pantallas anchas, pestañas verticales; en el móvil, como los ajustes del teléfono: la lista de apartados y, al
  // tocar uno, el apartado solo
  const isWide = useMediaQuery('(min-width: 768px)')

  return (
    <main className={'mb-4'} data-title={'Settings'} data-testid={'Test-Settings'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        {(isWide || section === null) && <p className={'text-body-secondary'}>{t(prefix + 'intro')}</p>}
        {isWide ? <SettingsTabs active={section ?? SECTIONS[0].id} /> : <SettingsList active={section} />}
      </Container>
    </main>
  )
}

/**
 * Pantallas anchas: pestañas verticales a la izquierda y el apartado a la derecha. Cambiar de pestaña no añade una
 * entrada al historial: «atrás» sale de la configuración
 */
function SettingsTabs({ active }: { active: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Si el foco estaba en el apartado que se cierra (p. ej. en un enlace a otro apartado, #speech), pasa a la pestaña
  // abierta: si no, se quedaría en algo oculto
  useEffect(() => {
    const focused = document.activeElement
    if (focused === null || focused === document.body || focused.getClientRects().length > 0) return
    document.getElementById(childId(active, 'tab'))?.focus()
  }, [active])

  return (
    // Sin fundido al cambiar de apartado: el contenido aparece al momento
    <Tab.Container generateChildId={childId} activeKey={active} transition={false}
      onSelect={(key) => key !== null && key !== active && navigate({ hash: key }, { replace: true })}>
      <Row className={'g-3'}>
        <Col md={4} lg={3}>
          <Nav variant={'pills'} className={'n4l-settings-tabs flex-column'} aria-orientation={'vertical'}
            aria-label={t(prefix + 'sections')} data-testid={'Test-Settings-Tabs'}>
            {SECTIONS.map(({ id }) => (
              <Nav.Item key={id}>
                <Nav.Link eventKey={id} data-hash-target={id} data-testid={'Test-Settings-Tab-' + id}>{t(prefix + id + '.title')}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Col>
        <Col md={8} lg={9}>
          <Tab.Content>
            {SECTIONS.map(({ id, Content }) => <Tab.Pane key={id} eventKey={id}><Content /></Tab.Pane>)}
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  )
}

/**
 * Móvil: la lista de apartados, cada uno con lo que tiene, y al tocar uno, ese apartado solo, con «Todos los apartados»
 * para volver (también el botón atrás del teléfono: entrar en un apartado añade una entrada al historial). Al cambiar de
 * vista, arriba y el foco en lo que se acaba de abrir: el título del apartado o, al volver, el apartado del que se viene
 */
function SettingsList({ active }: { active: string | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fromList = (location.state as { fromList?: boolean } | null)?.fromList === true

  const previous = useRef(active)
  useEffect(() => {
    const from = previous.current
    if (from === active) return
    previous.current = active
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (active !== null) document.getElementById(headingId(active))?.focus({ preventScroll: true })
    else if (from !== null) document.querySelector<HTMLElement>(`[data-settings-item="${from}"]`)?.focus({ preventScroll: true })
  }, [active])

  if (active === null) {
    return (
      <nav aria-label={t(prefix + 'sections')} data-testid={'Test-Settings-List'}>
        <ul className={'list-group n4l-settings-list'}>
          {SECTIONS.map(({ id }) => (
            <li key={id} className={'list-group-item p-0'}>
              <Link to={{ hash: id }} state={{ fromList: true }} className={'list-group-item-action n4l-settings-list-link'}
                data-settings-item={id} data-testid={'Test-Settings-Item-' + id}>
                <span className={'flex-grow-1'}>
                  <span className={'d-block fw-semibold'}>{t(prefix + id + '.title')}</span>
                  <span className={'d-block small text-body-secondary'}>{t(prefix + id + '.summary')}</span>
                </span>
                <ChevronRight className={'flex-shrink-0'} aria-hidden={true} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  const { Content } = SECTIONS.find(({ id }) => id === active)!
  return <>
    {/* Volver: si se ha llegado desde la lista, como el botón atrás; si se ha entrado directo (un enlace), a la lista */}
    <Button variant={'link'} className={'px-0 mb-2 d-inline-flex align-items-center gap-1'} data-testid={'Test-Settings-Back'}
      onClick={() => (fromList ? navigate(-1) : navigate({ hash: '' }, { replace: true }))}>
      <ChevronLeft aria-hidden={true} />{t(prefix + 'back')}
    </Button>
    <Content />
  </>
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

/**
 * Accesibilidad: el tamaño del texto, el espaciado, el contraste, el movimiento, los enlaces, el foco y el visor de
 * tfjs-vis. Lo que ya pide el sistema (menos movimiento, más contraste) se aplica también sin activarlo aquí
 */
function AccessibilitySettings() {
  const { t, i18n } = useTranslation()
  const settings = useDisplaySettings()
  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' })
  const systemReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const systemMoreContrast = window.matchMedia?.('(prefers-contrast: more)').matches ?? false
  const flags: Array<{ key: Exclude<keyof DisplaySettings_t, 'textSize'>, note?: string }> = [
    { key: 'spacing' },
    { key: 'highContrast', note: systemMoreContrast ? t(prefix + 'accessibility.system-on') : undefined },
    { key: 'reduceMotion', note: systemReducedMotion ? t(prefix + 'accessibility.system-on') : undefined },
    { key: 'underlineLinks' },
    { key: 'strongFocus' },
    { key: 'openVisor' },
  ]

  return (
    <Section id={'accessibility'} title={t(prefix + 'accessibility.title')} help={t(prefix + 'accessibility.help')}>
      {/* Fuera de las analíticas: ni los clics en estos ajustes (docs/analytics.md) */}
      <div data-analytics-private={true}>
        <fieldset className={'mb-3'}>
          <legend className={'form-label fs-6 mb-1'}>{t(prefix + 'accessibility.text-size')}</legend>
          {TEXT_SIZES.map((size) => (
            <Form.Check key={size} inline={true} type={'radio'} id={'settings-text-size-' + size} name={'settings-text-size'}
              label={percent.format(size / 100)}
              checked={settings.textSize === size}
              onChange={() => updateDisplaySettings({ textSize: size })} />
          ))}
        </fieldset>
        {flags.map(({ key, note }) => (
          <div key={key} className={'mb-2'}>
            <Form.Check type={'switch'} id={'settings-display-' + key}
              label={t(prefix + 'accessibility.' + key)}
              checked={settings[key]}
              aria-describedby={'settings-display-' + key + '-help'}
              onChange={(event) => updateDisplaySettings({ [key]: event.target.checked })} />
            <Form.Text id={'settings-display-' + key + '-help'} className={'d-block'}>
              {t(prefix + 'accessibility.' + key + '-help')}{note !== undefined && <> {note}</>}
            </Form.Text>
          </div>
        ))}
        <p className={'small mb-0'}>
          {t(prefix + 'accessibility.guide')} <Link to={'#speech'}>{t(prefix + 'speech.title')}</Link>
        </p>
      </div>
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
      <Form.Check type={'switch'} id={'settings-speech-voice'} className={'mb-1'}
        label={t(prefix + 'speech.voice')}
        checked={voice}
        aria-describedby={'settings-speech-voice-help'}
        onChange={(event) => updateGuideSettings({ voice: event.target.checked })} />
      {/* El lector de pantalla ya dice cada paso: con las dos voces a la vez no se entiende ninguna */}
      <Form.Text id={'settings-speech-voice-help'} className={'d-block mb-2'}>{t(prefix + 'speech.screen-reader')}</Form.Text>
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
              {option.localService ? option.name : `${option.name} (${t('guide.voice-online')})`}
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
      <p className={'small text-body-secondary'} data-testid={'Test-Settings-Connection'}>{t(prefix + 'downloads.now-' + now)}</p>
      <p className={'small mb-0'}>
        <Trans i18nKey={prefix + 'downloads.saved'} components={{ link1: <Link to={'#data'} /> }} />
      </p>
    </Section>
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

/** Un tamaño en el idioma de la página, en la unidad que toque: «350 kB», «12,4 MB», «1,2 GB» */
function formatBytes(bytes: number, language: string): string {
  const [value, unit] = bytes >= 1024 ** 3 ? [bytes / 1024 ** 3, 'gigabyte'] : bytes >= 1024 ** 2 ? [bytes / 1024 ** 2, 'megabyte'] : [bytes / 1024, 'kilobyte']
  return new Intl.NumberFormat(language, { style: 'unit', unit, maximumFractionDigits: 1 }).format(value)
}

type Usage_t = { count: number, bytes: number }
type StoredUsage_t = {
  trained   : Usage_t
  // Lo de las cachés del service worker (null si el navegador no tiene Cache Storage); los modelos, uno a uno
  pretrained: (Usage_t & { list: SavedModel_t[] }) | null
  offline   : Usage_t | null
  // Lo que ocupa la web en total y lo que le deja el navegador (null si no lo dice)
  total     : { usage: number, quota: number } | null
}

async function readStoredUsage(): Promise<StoredUsage_t> {
  const [trained, cached, estimate] = await Promise.all([
    storedModelsUsage(),
    typeof caches === 'undefined' ? null : offlineUsage(),
    navigator.storage?.estimate?.().catch(() => null) ?? null,
  ])
  return {
    trained,
    // Cuántos modelos: los ficheros que no son de ninguno conocido no cuentan como uno
    pretrained: cached === null ? null : {
      count: cached.models.list.filter(({ model }) => model !== null).length,
      bytes: cached.models.bytes,
      list : cached.models.list,
    },
    offline: cached === null ? null : { count: cached.files - cached.models.files, bytes: cached.bytes - cached.models.bytes },
    total  : estimate?.usage === undefined ? null : { usage: estimate.usage, quota: estimate.quota ?? 0 },
  }
}

/**
 * Una cosa guardada: qué es, cuánto hay (cuánto ocupa y cuántos son) y, si hay algo, el botón para borrarlo y el
 * detalle (`children`, debajo)
 */
function StoredItem({ id, usage, action, children }: { id: string, usage?: Usage_t, action?: ReactNode, children?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const hasData = usage !== undefined && (usage.count > 0 || usage.bytes > 0)
  return (
    <li className={'list-group-item n4l-stored-item'} data-testid={'Test-Settings-Stored-' + id}>
      <div className={'n4l-stored-item-text'}>
        <span className={'d-block fw-semibold'}>{t(prefix + 'data.' + id + '.title')}</span>
        <span className={'d-block small text-body-secondary'}>{t(prefix + 'data.' + id + '.help')}</span>
      </div>
      {usage !== undefined &&
        <div className={'n4l-stored-item-side'}>
          <span className={'n4l-stored-amount'}>
            {hasData && <span className={'d-block fw-semibold'}>{formatBytes(usage.bytes, i18n.language)}</span>}
            <span className={'d-block small text-body-secondary'}>{t(prefix + 'data.' + id + '.count', { count: usage.count })}</span>
          </span>
          {hasData && action}
        </div>}
      {children}
    </li>
  )
}

/** Los modelos preentrenados guardados, cada uno con lo que ocupa, un enlace a su página y un botón para borrarlo */
function SavedModelsList({ list, onDelete }: { list: SavedModel_t[], onDelete: (model: SavedModel_t['model']) => Promise<void> }) {
  const { t, i18n } = useTranslation()
  return (
    <ul className={'n4l-stored-list'} data-testid={'Test-Settings-SavedModels'}>
      {list.map(({ model, bytes }) => {
        const name = model === null ? t(prefix + 'data.pretrained.other') : t(model.title)
        return (
          <li key={model === null ? '' : model.task + '/' + model.key}>
            {model === null
              ? <span className={'n4l-stored-list-name'}>{name}</span>
              : <Link className={'n4l-stored-list-name'} to={`/playground/${model.task}/model/${model.key}`}>{name}</Link>}
            <span className={'n4l-stored-list-side'}>
              <span className={'n4l-stored-list-size'}>{formatBytes(bytes, i18n.language)}</span>
              <N4LConfirmButton label={t(prefix + 'data.delete')} ariaLabel={t(prefix + 'data.pretrained.delete-one', { model: name })}
                question={t(prefix + 'data.pretrained.question-one', { model: name })} confirmLabel={t(prefix + 'data.delete-confirm')}
                onConfirm={() => onDelete(model)} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Lo guardado en el navegador, cada cosa con lo que ocupa y su botón para borrarla: los modelos entrenados, los
 * preentrenados descargados, lo guardado para usar sin conexión (en la versión publicada) y los ajustes. Y, aparte,
 * restablecerlo todo
 */
function StoredDataSettings() {
  const { t, i18n } = useTranslation()
  const [usage, setUsage] = useState<StoredUsage_t | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let isCancelled = false
    readStoredUsage().then((result) => {
      if (!isCancelled) setUsage(result)
    })
    return () => { isCancelled = true }
  }, [])

  const deleteAndRefresh = async (remove: () => Promise<void>) => {
    await remove()
    setUsage(await readStoredUsage())
  }
  const handleClick_Reset = async () => {
    await resetAllSettings()
    // Para que todo vuelva a su valor por defecto (idioma del navegador, tema del sistema…)
    window.location.reload()
  }
  const confirmLabel = t(prefix + 'data.delete-confirm')

  return (
    <Section id={'data'} title={t(prefix + 'data.title')} help={t(prefix + 'data.help')}>
      {usage?.total &&
        <p className={'small mb-3'} data-testid={'Test-Settings-StorageTotal'}>
          <Trans i18nKey={prefix + 'data.total'} values={{ used: formatBytes(usage.total.usage, i18n.language) }}
            components={{ strong: <strong /> }} />
        </p>}
      <ul className={'list-group mb-4'} aria-busy={usage === null}>
        <StoredItem id={'trained'} usage={usage?.trained}
          action={usage && <N4LConfirmButton label={t(prefix + 'data.delete')} ariaLabel={t(prefix + 'data.trained.delete')}
            question={t(prefix + 'data.trained.question', { count: usage.trained.count })} confirmLabel={confirmLabel}
            testId={'Test-Settings-ModelsDelete'} onConfirm={() => deleteAndRefresh(() => deleteTrainedModels())} />} />
        {usage?.pretrained &&
          <StoredItem id={'pretrained'} usage={usage.pretrained}
            action={<N4LConfirmButton label={t(prefix + 'data.delete')} ariaLabel={t(prefix + 'data.pretrained.delete')}
              question={t(prefix + 'data.pretrained.question')} confirmLabel={confirmLabel}
              onConfirm={() => deleteAndRefresh(clearSavedModels)} />}>
            {usage.pretrained.list.length > 0 &&
              <SavedModelsList list={usage.pretrained.list} onDelete={(model) => deleteAndRefresh(() => clearSavedModel(model))} />}
          </StoredItem>}
        {import.meta.env.PROD && usage?.offline &&
          <StoredItem id={'offline'} usage={usage.offline}
            action={<N4LConfirmButton label={t(prefix + 'data.delete')} ariaLabel={t(prefix + 'data.offline.delete')}
              question={t(prefix + 'data.offline.question')} confirmLabel={confirmLabel}
              onConfirm={() => deleteAndRefresh(clearOfflinePages)} />} />}
        <StoredItem id={'settings'} />
      </ul>

      <div className={'n4l-danger-zone'}>
        <h3 className={'h6 text-danger-emphasis'}>{t(prefix + 'data.reset')}</h3>
        <p className={'small text-body-secondary'}>{t(prefix + 'data.reset-help')}</p>
        {!confirming && <Button variant={'outline-danger'} onClick={() => setConfirming(true)}>{t(prefix + 'data.reset')}</Button>}
        {confirming &&
          <Alert variant={'danger'} className={'mb-0'}>
            <p className={'mb-2'}>{t(prefix + 'data.confirm')}</p>
            <div className={'d-flex flex-wrap gap-2'}>
              <Button variant={'danger'} onClick={handleClick_Reset} data-testid={'Test-Settings-ResetConfirm'}>{t(prefix + 'data.confirm-button')}</Button>
              <Button variant={'outline-secondary'} onClick={() => setConfirming(false)}>{t(prefix + 'data.cancel')}</Button>
            </div>
          </Alert>}
      </div>
    </Section>
  )
}

// Los apartados, en el orden de las pestañas: cada uno con su ancla (/settings#privacy…) y su contenido
const SECTIONS = [
  { id: 'appearance', Content: AppearanceSettings },
  { id: 'accessibility', Content: AccessibilitySettings },
  { id: 'backend', Content: BackendSettings },
  { id: 'downloads', Content: DownloadSettings },
  { id: 'speech', Content: SpeechSettings },
  { id: 'tutorials', Content: TutorialSettings },
  { id: 'learning', Content: LearningSettings },
  { id: 'privacy', Content: PrivacySettings },
  { id: 'data', Content: StoredDataSettings },
] as const

/**
 * Los ids de las pestañas y de sus paneles. /settings#privacy lleva a la pestaña (data-hash-target, en
 * N4LScrollManager), le da el foco (el lector la anuncia) y deja la página arriba: las pestañas ya se ven al cargarla
 */
const childId = (key: unknown, type: string) => `settings-${type}-${String(key)}`
/** El id del título de cada apartado (al que va el foco al abrirlo en el móvil) */
const headingId = (section: string) => `settings-heading-${section}`
