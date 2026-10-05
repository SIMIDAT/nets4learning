import './N4LNavbar.css'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Badge, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { BoxSeam, Cpu, GpuCard, MoonStarsFill, SunFill, Translate } from 'react-bootstrap-icons'
import IconGithub from '@assets/github.svg'
import { changeUserLanguage, LANGUAGE_OPTIONS } from '@core/i18n/language'
import { changeUserTheme, type Theme_t } from '@core/theme'
import { useTheme } from '@hooks/useTheme'
import { useLocalPackages } from '@hooks/useLocalPackages'
import { isTask, TASK_INFO } from '@components/task/taskInfo'
import {
  changeUserTFBackend,
  DEFAULT_TF_BACKEND,
  getActiveTFBackend,
  detectWebGPUAdapter,
  isTFBackendAvailable,
  subscribeActiveTFBackend,
  TF_BACKEND_LABELS,
  TF_BACKENDS,
  type TFBackend_t,
  type WebGPUAdapter_t,
} from '@core/tfBackend'

// Páginas del menú; Inicio solo está activa en la home. Detrás de Inicio va el desplegable de las tareas
const [HOME_LINK, ...NAV_LINKS]: Array<{ to: string, i18n: string }> = [
  { to: '/', i18n: 'header.home' },
  { to: '/manual', i18n: 'header.manual' },
  { to: '/glossary', i18n: 'header.glossary' },
  { to: '/datasets', i18n: 'header.datasets' },
  { to: '/analyze', i18n: 'header.analyze' },
]

// Los paquetes .n4l del usuario, aparte: al final de las páginas, con su icono y cuántos tiene guardados
const PACKAGES_LINK = '/packages'

const isActivePath = (pathname: string, to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/'))

// La tarea en la que se está: su página, sus menús de modelos y conjuntos o su playground
const TASK_PAGES = ['task', 'select-model', 'select-dataset', 'playground']
const taskOfPath = (pathname: string) => {
  const [page, task] = pathname.split('/').filter((part) => part !== '')
  return TASK_PAGES.includes(page) && isTask(task) ? task : undefined
}

export default function N4LNavbar() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  // main.tsx ya ha aplicado el tema inicial (el guardado o el del sistema)
  // También cambia si se elige desde /settings
  const theme = useTheme()

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

  const activeTask = taskOfPath(pathname)
  const savedPackages = useLocalPackages().length
  const isPackagesPage = isActivePath(pathname, PACKAGES_LINK)
  const navLink = ({ to, i18n: i18nKey }: { to: string, i18n: string }) => {
    const isActive = isActivePath(pathname, to)
    return (
      <Nav.Item key={to}>
        <Nav.Link as={Link} to={to} active={isActive} aria-current={isActive ? 'page' : undefined}
          onClick={() => setExpanded(false)}>
          <Trans i18nKey={i18nKey} />
        </Nav.Link>
      </Nav.Item>
    )
  }

  const currentLanguage = LANGUAGE_OPTIONS.find(({ language }) => i18n.resolvedLanguage === language)?.label ?? i18n.language
  // Título de los desplegables de ajustes: el ajuste y, solo en el menú del móvil y la tablet, su valor actual (en
  // escritorio, solo el nombre)
  // Un ajuste: su icono (Bootstrap Icons, decorativo), su nombre y, en el menú del móvil, su valor
  const settingTitle = (icon: React.ReactNode, label: string, value: string) => <>
    <span className={'n4l-navbar-icon'} aria-hidden={true}>{icon}</span>
    {label}
    <span className={'n4l-navbar-value d-lg-none'}>{value}</span>
  </>
  // El backend calcula en la tarjeta gráfica (WebGL, WebGPU) o en el procesador (WASM, CPU)
  const backendIcon = (backend: TFBackend_t) => (backend === 'webgl' || backend === 'webgpu' ? <GpuCard /> : <Cpu />)

  return (
    <>
      <Navbar ref={navbar_ref} expand="lg" sticky={'top'} className={'bg-body-tertiary n4l-navbar'} expanded={expanded} onToggle={setExpanded}>
        <Container className={'n4l-container-wide'}>
          <Navbar.Brand as={Link} to={'/'}>
            <img
              src={import.meta.env.VITE_PATH + '/logo-64.png'}
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
                {navLink(HOME_LINK)}
                {/* Las cinco tareas: cada una abre su página (modelos ya entrenados o diseñar una red) */}
                <NavDropdown title={t('header.tasks')} id={'tasks-nav-dropdown'} active={activeTask !== undefined} data-testid={'Test-Navbar-Tasks'}>
                  {Object.values(TASK_INFO).map(({ task, i18nTitle }) => {
                    const isCurrent = pathname === `/task/${task}`
                    return (
                      <NavDropdown.Item key={task} as={Link} to={`/task/${task}`} active={activeTask === task}
                        aria-current={isCurrent ? 'page' : undefined} onClick={() => setExpanded(false)}>
                        <Trans i18nKey={i18nTitle} />
                      </NavDropdown.Item>
                    )
                  })}
                </NavDropdown>
                {NAV_LINKS.map(navLink)}
                <Nav.Item className={'n4l-navbar-packages'}>
                  <Nav.Link as={Link} to={PACKAGES_LINK} active={isPackagesPage} aria-current={isPackagesPage ? 'page' : undefined}
                    onClick={() => setExpanded(false)} data-testid={'Test-Navbar-Packages'}>
                    <span className={'n4l-navbar-icon'} aria-hidden={true}><BoxSeam /></span>
                    <Trans i18nKey={'header.packages'} />
                    {savedPackages > 0 &&
                      <Badge pill bg={'primary'} className={'n4l-navbar-packages-count'} title={t('header.packages-saved', { count: savedPackages })}>
                        {savedPackages}
                      </Badge>}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Nav className={'n4l-navbar-settings'}>
                <NavDropdown align={'end'} title={settingTitle(<Translate />, t('header.language'), currentLanguage)} id="change-language-nav-dropdown">
                  {LANGUAGE_OPTIONS.map(({ language, label }) => (
                    <NavDropdown.Item key={language} lang={language} active={i18n.language === language} onClick={() => changeUserLanguage(i18n, language)}>
                      {label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
                <NavDropdown align={'end'} title={settingTitle(theme === 'dark' ? <MoonStarsFill /> : <SunFill />, t('header.theme'), t(theme === 'dark' ? 'header.theme-dark' : 'header.theme-light'))} id="change-theme-nav-dropdown">
                  <NavDropdown.Item active={theme === 'light'} onClick={() => handleClick_ChangeTheme('light')}>
                    <span className={'n4l-navbar-icon'} aria-hidden={true}><SunFill /></span>
                    <Trans i18nKey={'header.theme-light'} />
                  </NavDropdown.Item>
                  <NavDropdown.Item active={theme === 'dark'} onClick={() => handleClick_ChangeTheme('dark')}>
                    <span className={'n4l-navbar-icon'} aria-hidden={true}><MoonStarsFill /></span>
                    <Trans i18nKey={'header.theme-dark'} />
                  </NavDropdown.Item>
                </NavDropdown>
                <NavDropdown align={'end'} title={settingTitle(backendIcon(tfBackend), t('header.backend'), TF_BACKEND_LABELS[tfBackend])} id="change-tf-backend-nav-dropdown" onToggle={handleToggle_TFBackend}>
                  {TF_BACKENDS.map((backend) => {
                    const isAvailable = isTFBackendAvailable(backend) && (backend !== 'webgpu' || webgpuAdapter !== null)
                    return (
                      <NavDropdown.Item key={backend}
                        active={tfBackend === backend}
                        disabled={!isAvailable || isChangingTFBackend}
                        onClick={() => handleClick_ChangeTFBackend(backend)}>
                        <span className={'n4l-navbar-icon'} aria-hidden={true}>{backendIcon(backend)}</span>
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
