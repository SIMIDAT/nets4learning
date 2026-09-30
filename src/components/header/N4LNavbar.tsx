import "./N4LNavbar.css"
import { useState } from 'react'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import IconThemeLight from '@assets/sun.svg'
import IconThemeDark from '@assets/moon.svg'
import IconGithub from '@assets/github.svg'
import { changeUserLanguage, type Language_t } from '@core/i18n/language'
import { changeUserTheme, type Theme_t } from '@core/theme'

// Cada idioma con su nombre en ese idioma (sin banderas: un idioma no es un país)
const LANGUAGE_OPTIONS: Array<{ language: Language_t, label: string }> = [
  { language: 'en', label: 'English' },
  { language: 'es', label: 'Español' },
  { language: 'ja', label: '日本語' },
]

export default function N4LNavbar() {
  const { t, i18n } = useTranslation()
  // main.tsx ya ha aplicado el tema inicial (el guardado o el del sistema)
  const [theme, setTheme] = useState<Theme_t>(() => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')

  const handleClick_ChangeTheme = (newTheme: Theme_t) => {
    changeUserTheme(newTheme)
    setTheme(newTheme)
  }

  return (
    <>
      <Navbar expand="lg" className={'bg-body-tertiary'}>
        <Container>
          <Navbar.Brand as={Link} to={'/'}>
            <img
              src={import.meta.env.VITE_PATH + '/without_background.png'}
              width="30"
              height="30"
              className="d-inline-block align-top me-1"
              alt="" />
            Nets4Learning
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item><Nav.Link as={Link} to={'/'}><Trans i18nKey={'header.home'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/manual'}><Trans i18nKey={'header.manual'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/glossary'}><Trans i18nKey={'header.glossary'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/datasets'}><Trans i18nKey={'header.datasets'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/analyze'}><Trans i18nKey={'header.analyze'} /></Nav.Link></Nav.Item>
              {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/contribute/')}>*/}
              {/*  <Trans i18nKey={'header.contribute'} />*/}
              {/*</Nav.Link>*/}
              {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/documentation/')}>*/}
              {/*  <Trans i18nKey={'header.documentation'} />*/}
              {/*</Nav.Link>*/}
            </Nav>
            <Nav>
              <Nav.Item>
                <Nav.Link href={'https://github.com/SIMIDAT/nets4learning'}
                  target={'_blank'}
                  rel={'noreferrer'}
                  aria-label={'GitHub'}
                  title={'GitHub'}>
                  <span className={'n4l-icon-1rem'} aria-hidden={true}>
                    <IconGithub />
                  </span>
                </Nav.Link>
              </Nav.Item>
              <NavDropdown title={t('header.language')} id="change-language-nav-dropdown">
                {LANGUAGE_OPTIONS.map(({ language, label }) => (
                  <NavDropdown.Item key={language} lang={language} active={i18n.language === language} onClick={() => changeUserLanguage(i18n, language)}>
                    {label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <NavDropdown title={t('header.theme')} id="change-theme-nav-dropdown">
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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}
