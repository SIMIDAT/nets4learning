import { Fragment, useMemo, useState, useSyncExternalStore, version as reactVersion } from 'react'
import { Badge, Card, Col, Container, Form, Row, Tab, Table, Tabs } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

import packageInfo from '../../../package.json'
import { getActiveTFBackend, subscribeActiveTFBackend, TF_BACKEND_LABELS } from '@core/tfBackend'

const REPOSITORY = 'https://github.com/SIMIDAT/nets4learning'

type Dependencies_t = Record<string, string>

/** Una tabla de dependencias (nombre con enlace a npm y versión declarada), filtrada por lo que se busca */
function DependencyTable({ dependencies, filter }: { dependencies: Dependencies_t, filter: string }) {
  const { t } = useTranslation()
  const rows = Object.entries(dependencies).filter(([name]) => name.toLowerCase().includes(filter.trim().toLowerCase()))
  if (rows.length === 0) return <p className={'text-body-secondary mt-3 mb-0'}>{t('pages.version.no-results')}</p>
  return (
    <Table responsive={true} striped={true} hover={true} size={'sm'} className={'mt-3 mb-0'}>
      <thead>
        <tr>
          <th>{t('pages.version.package')}</th>
          <th className={'text-end'}>{t('pages.version.declared')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, range]) => (
          <tr key={name}>
            <td><a href={`https://www.npmjs.com/package/${name}`} target={'_blank'} rel={'noreferrer'}>{name}</a></td>
            <td className={'text-end font-monospace'}>{range}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/** La versión de la aplicación, con qué se está ejecutando y de qué depende */
export default function Version() {
  const { t } = useTranslation()
  const prefix = 'pages.version.'
  const backend = useSyncExternalStore(subscribeActiveTFBackend, getActiveTFBackend)
  const [filter, setFilter] = useState('')

  // Lo que se ejecuta de verdad (no el rango declarado en package.json)
  const runtime = useMemo(() => [
    { label: t(prefix + 'app'), value: packageInfo.version },
    { label: t(prefix + 'environment'), value: `${import.meta.env.VITE_ENVIRONMENT ?? '—'} · ${import.meta.env.MODE}` },
    { label: 'TensorFlow.js', value: tfjs.version.tfjs },
    { label: t(prefix + 'backend'), value: TF_BACKEND_LABELS[backend] },
    { label: 'React', value: reactVersion },
  ], [t, backend])

  const dependencies = packageInfo.dependencies as Dependencies_t
  const devDependencies = packageInfo.devDependencies as Dependencies_t

  return (
    <main className={'mb-4'} data-title={'Version'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'lead'}>
          Nets4Learning <Badge bg={'primary'} className={'align-middle'}>{packageInfo.version}</Badge>
        </p>

        <Row className={'g-3'}>
          <Col lg={5}>
            <Card className={'h-100'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'runtime')}</h2></Card.Header>
              <Card.Body>
                <dl className={'row mb-0'}>
                  {runtime.map(({ label, value }) => (
                    <Fragment key={label}>
                      <dt className={'col-6 fw-normal text-body-secondary'}>{label}</dt>
                      <dd className={'col-6 mb-2 font-monospace'}>{value}</dd>
                    </Fragment>
                  ))}
                </dl>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={7}>
            <Card className={'h-100'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'changes')}</h2></Card.Header>
              <Card.Body>
                <p>{t(prefix + 'changes-text')}</p>
                <ul className={'mb-0'}>
                  <li><a href={REPOSITORY + '/commits'} target={'_blank'} rel={'noreferrer'}>{t(prefix + 'commits')}</a></li>
                  <li><a href={REPOSITORY + '/releases'} target={'_blank'} rel={'noreferrer'}>{t(prefix + 'releases')}</a></li>
                  <li><a href={REPOSITORY + '/blob/main/CHANGELOG.md'} target={'_blank'} rel={'noreferrer'}>CHANGELOG.md</a></li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className={'mt-3'}>
          <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
            <h2 className={'h5 mb-0'}>{t(prefix + 'dependencies')}</h2>
            <Form.Control type={'search'} size={'sm'} style={{ maxWidth: '16rem' }}
              placeholder={t(prefix + 'search')} aria-label={t(prefix + 'search')}
              value={filter} onChange={(event) => setFilter(event.target.value)} />
          </Card.Header>
          <Card.Body>
            <p className={'small text-body-secondary'}>{t(prefix + 'dependencies-help')}</p>
            <Tabs defaultActiveKey={'dependencies'} id={'version-dependencies'}>
              <Tab eventKey={'dependencies'} title={`${t(prefix + 'runtime-dependencies')} (${Object.keys(dependencies).length})`}>
                <DependencyTable dependencies={dependencies} filter={filter} />
              </Tab>
              <Tab eventKey={'dev'} title={`${t(prefix + 'dev-dependencies')} (${Object.keys(devDependencies).length})`}>
                <DependencyTable dependencies={devDependencies} filter={filter} />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>
    </main>
  )
}
