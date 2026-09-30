import "./N4LNavbar.css"
import { useEffect, useState } from 'react'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import IconLangES from '@assets/es.svg'
import IconLangGB from '@assets/gb.svg'
import IconThemeLight from '@assets/sun.svg'
import IconThemeDark from '@assets/moon.svg'
import IconGithub from '@assets/github.svg'
import { changeUserLanguage, type Language_t } from '@core/i18n/language'

// Cada idioma con su nombre en ese idioma
const LANGUAGE_OPTIONS: Array<{ language: Language_t, label: string, icon: React.ReactNode }> = [
  { language: 'en', label: 'English', icon: <IconLangGB /> },
  { language: 'es', label: 'Español', icon: <IconLangES /> },
  { language: 'ja', label: '日本語', icon: '🇯🇵' },
]

export default function N4LNavbar() {
  const { t, i18n } = useTranslation()
  const [dataTheme, setDataTheme] = useState('light')

  useEffect(() => {
    const htmlElement = document.querySelector('html')!
    htmlElement.setAttribute('data-bs-theme', dataTheme)
    htmlElement.setAttribute('data-theme', dataTheme)
  }, [dataTheme])

  return (
    <>
      <Navbar expand="lg" className={'bg-body-tertiary'}>
        <Container>
          <Navbar.Brand as={Link} to={'/'}>
            <img
              src={import.meta.env.VITE_PATH + '/without_background.png'}
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt="N4L" />
            Nets4Learning
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item><Nav.Link as={Link} to={'/'}><Trans i18nKey={'header.home'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/manual'}><Trans i18nKey={'header.manual'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/glossary'}><Trans i18nKey={'header.glossary'} /></Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link as={Link} to={'/datasets'}><Trans i18nKey={'header.datasets'} /></Nav.Link></Nav.Item>
              {import.meta.env.VITE_SHOW_NEW_FEATURE === 'true' &&
                <Nav.Item><Nav.Link as={Link} to={'/analyze'}><Trans i18nKey={'header.analyze'} /></Nav.Link></Nav.Item>
              }
              {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/contribute/')}>*/}
              {/*  <Trans i18nKey={'header.contribute'} />*/}
              {/*</Nav.Link>*/}
              {/*<Nav.Link onClick={() => handleClick_GoTo__PAGE__('/documentation/')}>*/}
              {/*  <Trans i18nKey={'header.documentation'} />*/}
              {/*</Nav.Link>*/}
            </Nav>
            <Nav>
              <Nav.Item>
                <Nav.Link href={'https://github.com/SIMIDAT/nets4learning'}>
                  <div className={'me-2 n4l-icon-1rem'}>
                    <IconGithub />
                  </div>
                </Nav.Link>
              </Nav.Item>
              <NavDropdown title={t('header.language')} id="change-language-nav-dropdown">
                {LANGUAGE_OPTIONS.map(({ language, label, icon }) => (
                  <NavDropdown.Item key={language} active={i18n.language === language} onClick={() => changeUserLanguage(i18n, language)}>
                    <span className={'me-2 n4l-icon-1rem'} style={{ verticalAlign: 'unset' }}>{icon}</span>
                    {label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <NavDropdown title={t('header.theme')} id="change-theme-nav-dropdown">
                <NavDropdown.Item onClick={() => setDataTheme('light')}>
                  <span className={'me-2 n4l-icon-1rem'}>
                    <IconThemeLight />
                  </span>
                  Light
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setDataTheme('dark')}>
                  <span className={'me-2 n4l-icon-1rem'}>
                    <IconThemeDark />
                  </span>
                  Dark
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}
