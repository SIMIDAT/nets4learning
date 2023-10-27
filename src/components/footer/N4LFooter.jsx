// import './N4LFooter.css'
import React from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'

export default function N4LFooter () {
  const { t } = useTranslation()

  return (
    <>
      <footer className="bg-body-tertiary footer mt-auto py-3">
        <Container>
          <Row>
            <Col xs={12} sm={12} md={7}>
              <h3><Trans i18nKey={'footer.about-us'} /></h3>
              <ul style={{ padding: '0 1em' }}>
                <li>
                  <Trans i18nKey={'footer.directors'} />:{' '}
                  <a href="https://simidat.ujaen.es/members/arivera/" target="_blank" rel="noreferrer" className="link-secondary">Antonio Jesús Rivera Rivas</a>,{' '}
                  <a href="https://simidat.ujaen.es/members/lperez/" target="_blank" rel="noreferrer" className="link-secondary">María Dolores Pérez Godoy</a>,{' '}
                  <a href="https://simidat.ujaen.es/members/mjjesus/" target="_blank" rel="noreferrer" className="link-secondary">María José del Jesus Díaz</a>
                </li>
                <li>
                  <Trans i18nKey={'footer.developers'} />:{' '}
                  <a href="https://github.com/nonodev96/" target="_blank" rel="noreferrer" className="link-secondary">Antonio Mudarra Machuca</a>,{' '}
                  <a href="https://github.com/Davavico22" target="_blank" rel="noreferrer" className="link-secondary">David Valdivia Vico</a>
                </li>
                <li>
                  <Link to={'/terms-and-conditions'} className="link-secondary">
                    <Trans i18nKey={'footer.terms'} />
                  </Link>
                </li>
                <li>
                  <Link to={'/contribute'} className="link-secondary">
                    <Trans i18nKey={'footer.contribute'} />
                  </Link>
                </li>
                <li>
                  <Link to={'/version'} className="link-secondary">
                    <Trans i18nKey={'footer.version'} />
                  </Link>
                </li>
              </ul>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <h4>Nets4Learning</h4>
              <p>{t('footer.description-app')}</p>
              <Row className="align-items-center text-center">
                <Col>
                  <a href="https://simidat.ujaen.es" target="_blank" rel="noreferrer">
                    <img src={process.env.REACT_APP_PATH + '/assets/logo-simidat-2023.png'}
                         className={'img-fluid w-100'}
                         alt="SIMIDAT"
                    />
                  </a>
                </Col>
                <Col>
                  <a href="https://ujaen.es" target="_blank" rel="noreferrer">
                    <img src={process.env.REACT_APP_PATH + '/assets/uja.svg'}
                         className={'img-fluid w-50'}
                         alt="Universidad de Jaén"
                    />
                  </a>
                </Col>
                <Col>
                  <a href="https://dasci.es" target="_blank" rel="noreferrer">
                    <img src={process.env.REACT_APP_PATH + '/assets/DaSCI_logo-1.png'}
                         className={'img-fluid w-100'}
                         alt="DaSCI"
                    />
                  </a>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}