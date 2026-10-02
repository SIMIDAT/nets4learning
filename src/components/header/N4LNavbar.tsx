import "./N4LNavbar.css"
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import IconThemeLight from '@assets/sun.svg'
import IconThemeDark from '@assets/moon.svg'
import IconGithub from '@assets/github.svg'
import { changeUserLanguage, type Language_t } from '@core/i18n/language'
import { changeUserTheme, type Theme_t } from '@core/theme'
import {
  changeUserTFBackend,
  DEFAULT_TF_BACKEND,
  getActiveTFBackend,
  detectWebGPUAdapter,
  isTFBackendAvailable,
  subscribeActiveTFBackend,
  TF_BACKENDS,
  type TFBackend_t,
  type WebGPUAdapter_t,
} from '@core/tfBackend'

// Cada idioma con su nombre en ese idioma (sin banderas: un idioma no es un país)
const LANGUAGE_OPTIONS: Array<{ language: Language_t, label: string }> = [
  { language: 'en', label: 'English' },
  { language: 'es', label: 'Español' },
  { language: 'ja', label: '日本語' },
]

// Páginas del menú; Inicio solo está activa en la home
const NAV_LINKS: Array<{ to: string, i18n: string }> = [
  { to: '/', i18n: 'header.home' },
  { to: '/manual', i18n: 'header.manual' },
  { to: '/glossary', i18n: 'header.glossary' },
  { to: '/datasets', i18n: 'header.datasets' },
  { to: '/analyze', i18n: 'header.analyze' },
]

const isActivePath = (pathname: string, to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/'))

// Nombres propios: no se traducen
const TF_BACKEND_LABELS: Record<TFBackend_t, string> = {
  webgl : 'WebGL',
  webgpu: 'WebGPU',
  wasm  : 'WebAssembly',
  cpu   : 'CPU',
}

export default function N4LNavbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  // main.tsx ya ha aplicado el tema inicial (el guardado o el del sistema)
  const [theme, setTheme] = useState<Theme_t>(() => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')

  // Menú desplegado en móvil y tablet. Al cambiar de página se cierra: si no, tapa la página nueva
  const [expanded, setExpanded] = useState(false)
  const [menuPathname, setMenuPathname] = useState(pathname)
  if (menuPathname !== pathname) {
    setMenuPathname(pathname)
    setExpanded(false)
  }

  // La barra va fija arriba (sticky): su alto, sin el menú desplegado, queda en --n4l-navbar-height para lo que tiene
  // que ir debajo (la barra del índice del móvil, el índice lateral, las tarjetas fijas y los saltos a una sección)
  const navbar_ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const navbar = navbar_ref.current
    if (navbar === null || typeof ResizeObserver === 'undefined') return
    const update = () => {
      if (navbar.querySelector('.navbar-collapse.show, .navbar-collapse.collapsing') !== null) return
      document.documentElement.style.setProperty('--n4l-navbar-height', `${navbar.offsetHeight}px`)
    }
    const observer = new ResizeObserver(update)
    observer.observe(navbar)
    update()
    return () => observer.disconnect()
  }, [])

  const handleClick_ChangeTheme = (newTheme: Theme_t) => {
    changeUserTheme(newTheme)
    setTheme(newTheme)
  }

  const tfBackend = useSyncExternalStore(subscribeActiveTFBackend, getActiveTFBackend)
  // WebGPU y WebAssembly se descargan al elegirlos: mientras tanto no se puede elegir otro
  const [isChangingTFBackend, setIsChangingTFBackend] = useState(false)
  // Que exista navigator.gpu no basta para WebGPU: al abrir el menú se pregunta qué adaptador hay
  // (undefined mientras no se sabe)
  const [webgpuAdapter, setWebgpuAdapter] = useState<WebGPUAdapter_t | undefined>(undefined)

  const handleToggle_TFBackend = (isOpen: boolean) => {
    if (isOpen && isTFBackendAvailable('webgpu')) detectWebGPUAdapter().then(setWebgpuAdapter)
  }

  const handleClick_ChangeTFBackend = async (newBackend: TFBackend_t) => {
    if (newBackend === tfBackend) return
    setIsChangingTFBackend(true)
    const changed = await changeUserTFBackend(newBackend)
    setIsChangingTFBackend(false)
    if (!changed) {
      // sweetalert2 solo se descarga si hace falta: el menú va en la carga inicial
      const { default: alertHelper } = await import('@utils/alertHelper')
      await alertHelper.alertError(t('header.backend-error', { backend: TF_BACKEND_LABELS[newBackend] }), {
        text  : '',
        footer: '',
        html  : <>{t('header.backend-error-fallback', { backend: TF_BACKEND_LABELS[tfBackend] })}</>,
      })
    }
  }

  const currentLanguage = LANGUAGE_OPTIONS.find(({ language }) => i18n.resolvedLanguage === language)?.label ?? i18n.language
  // Título de los desplegables de ajustes: el ajuste y, solo en el menú del móvil y la tablet, su valor actual (en
  // escritorio, solo el nombre)
  const settingTitle = (label: string, value: string) => <>
    {label}
    <span className={'n4l-navbar-value d-lg-none'}>{value}</span>
  </>

  return (
    <>
      <Navbar ref={navbar_ref} expand="lg" sticky={'top'} className={'bg-body-tertiary n4l-navbar'} expanded={expanded} onToggle={setExpanded}>
        <Container className={'n4l-container-wide'}>
          <Navbar.Brand as={Link} to={'/'}>
            <img
              src={import.meta.env.VITE_PATH + '/without_background.png'}
              width="30"
              height="30"
              className="d-inline-block align-top me-1"
              alt="" />
            Nets4Learning
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="n4l-navbar-menu" aria-expanded={expanded} label={t('header.menu')} />
          <Navbar.Collapse id="n4l-navbar-menu">
            {/* Escritorio: páginas a la izquierda y ajustes a la derecha. Móvil: una lista, con los ajustes aparte.
                Tablet: dos columnas */}
            <div className={'n4l-navbar-menu'}>
              <Nav className={'me-lg-auto n4l-navbar-links'}>
                {NAV_LINKS.map(({ to, i18n: i18nKey }) => {
                  const isActive = isActivePath(pathname, to)
                  return (
                    <Nav.Item key={to}>
                      <Nav.Link as={Link} to={to} active={isActive} aria-current={isActive ? 'page' : undefined}
                        onClick={() => setExpanded(false)}>
                        <Trans i18nKey={i18nKey} />
                      </Nav.Link>
                    </Nav.Item>
                  )
                })}
                {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/contribute/')}>*/}
                {/*  <Trans i18nKey={'header.contribute'} />*/}
                {/*</Nav.Link>*/}
                {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/documentation/')}>*/}
                {/*  <Trans i18nKey={'header.documentation'} />*/}
                {/*</Nav.Link>*/}
              </Nav>
              <Nav className={'n4l-navbar-settings'}>
                <NavDropdown align={'end'} title={settingTitle(t('header.language'), currentLanguage)} id="change-language-nav-dropdown">
                  {LANGUAGE_OPTIONS.map(({ language, label }) => (
                    <NavDropdown.Item key={language} lang={language} active={i18n.language === language} onClick={() => changeUserLanguage(i18n, language)}>
                      {label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
                <NavDropdown align={'end'} title={settingTitle(t('header.theme'), t(theme === 'dark' ? 'header.theme-dark' : 'header.theme-light'))} id="change-theme-nav-dropdown">
                  <NavDropdown.Item active={theme === 'light'} onClick={() => handleClick_ChangeTheme('light')}>
                    <span className={'me-2 n4l-icon-1rem'}>
                      <IconThemeLight />
                    </span>
                    <Trans i18nKey={'header.theme-light'} />
                  </NavDropdown.Item>
                  <NavDropdown.Item active={theme === 'dark'} onClick={() => handleClick_ChangeTheme('dark')}>
                    <span className={'me-2 n4l-icon-1rem'}>
                      <IconThemeDark />
                    </span>
                    <Trans i18nKey={'header.theme-dark'} />
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown align={'end'} title={settingTitle(t('header.backend'), TF_BACKEND_LABELS[tfBackend])} id="change-tf-backend-nav-dropdown" onToggle={handleToggle_TFBackend}>
                  {TF_BACKENDS.map((backend) => {
                    const isAvailable = isTFBackendAvailable(backend) && (backend !== 'webgpu' || webgpuAdapter !== null)
                    return (
                      <NavDropdown.Item key={backend}
                        active={tfBackend === backend}
                        disabled={!isAvailable || isChangingTFBackend}
                        onClick={() => handleClick_ChangeTFBackend(backend)}>
                        {TF_BACKEND_LABELS[backend]}
                        {backend === DEFAULT_TF_BACKEND && <small className={'ms-2 opacity-75'}>({t('header.backend-default')})</small>}
                        {!isAvailable && <small className={'ms-2'}>({t('header.backend-unavailable')})</small>}
                        {backend === 'webgpu' && webgpuAdapter === 'software' && <small className={'ms-2'}>({t('header.backend-software')})</small>}
                      </NavDropdown.Item>
                    )
                  })}
                </NavDropdown>
                <Nav.Item>
                  <Nav.Link href={'https://github.com/SIMIDAT/nets4learning'}
                    target={'_blank'}
                    rel={'noreferrer'}
                    aria-label={'GitHub'}
                    title={'GitHub'}>
                    <span className={'n4l-icon-1rem'} aria-hidden={true}>
                      <IconGithub />
                    </span>
                    {/* En el menú del móvil el icono solo no se entiende */}
                    <span className={'d-lg-none ms-2'} aria-hidden={true}>GitHub</span>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}
