import { useState } from 'react'
import { Accordion, Button, Card, Col, Container, Row, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import N4LMarkdownDownloader from '@components/markdown/N4LMarkdownDownloader'
import { VERBOSE } from '@/CONSTANTS'

const REPOSITORY = 'https://github.com/SIMIDAT/nets4learning'

const BIBTEX = `@article{mudarra2024nets4learning,
  author  = {Antonio Mudarra Machuca and David Valdivia and Pietro Ducange and Manuel Germ{\\'a}n Morales and Antonio Jes{\\'u}s Rivera Rivas and Mar{\\'\\i}a Dolores P{\\'e}rez Godoy},
  title   = {Nets4Learning: A Web Platform for Designing and Testing ANN/DNN Models},
  journal = {Electronics},
  year    = {2024},
  volume  = {13},
  number  = {22},
  pages   = {4378},
  issn    = {2079-9292},
  doi     = {10.3390/electronics13224378},
  url     = {https://www.mdpi.com/2079-9292/13/22/4378},
}`

const LICENSE = `The MIT License (MIT)

Copyright (c) 2023  UNIVERSIDAD DE JAÉN | SIMIDAT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

// Las formas de colaborar, cada una con su enlace
const WAYS = [
  { key: 'issues', href: REPOSITORY + '/issues' },
  { key: 'translate', href: REPOSITORY + '/tree/main/public/locales' },
  { key: 'datasets', href: REPOSITORY + '/tree/main/src/pages/playground' },
  { key: 'code', href: REPOSITORY + '/pulls' },
] as const

// Órdenes útiles mientras se desarrolla (las mismas que el README)
const SCRIPTS = ['pnpm dev', 'pnpm test run', 'pnpm test:e2e', 'pnpm lint', 'pnpm build:simidat'] as const

/** Lo que hace falta saber para colaborar con el proyecto: cómo, cómo ponerlo en marcha, cómo citarlo y su licencia */
export default function Contribute() {
  const prefix = 'pages.contribute.'
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const checklist = t(prefix + 'checklist.items', { returnObjects: true })

  const handleClick_Copy = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (VERBOSE) console.debug('render Contribute')
  return (
    <main className={'mb-4'} data-title={'Contribute'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}><Trans i18nKey={prefix + 'title'} /></h1>
        <p className={'lead'}>{t(prefix + 'intro')}</p>
        <p>
          <a href={REPOSITORY} target={'_blank'} rel={'noreferrer'} className={'btn btn-primary'}>{t(prefix + 'github.title')}</a>
        </p>

        <h2 className={'h4 mt-4'}>{t(prefix + 'ways.title')}</h2>
        <Row xs={1} md={2} xl={4} className={'g-3'}>
          {WAYS.map(({ key, href }) => (
            <Col key={key}>
              <Card className={'h-100'}>
                <Card.Body>
                  <h3 className={'h6'}>{t(prefix + 'ways.' + key + '.title')}</h3>
                  <p className={'small text-body-secondary'}>{t(prefix + 'ways.' + key + '.text')}</p>
                </Card.Body>
                <Card.Footer className={'bg-transparent border-0 pt-0'}>
                  <a href={href} target={'_blank'} rel={'noreferrer'} className={'small'}>{t(prefix + 'ways.' + key + '.link')}</a>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className={'g-3 mt-2'}>
          <Col lg={7}>
            <Card className={'h-100'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'setup.title')}</h2></Card.Header>
              <Card.Body>
                <p>{t(prefix + 'setup.requirements')}</p>
                <pre className={'n4l-code bg-body-tertiary border rounded p-3'}><code>{'corepack enable\npnpm install\npnpm dev'}</code></pre>
                <p className={'small'}>{t(prefix + 'setup.url')} <code>http://localhost:5173/n4l/</code></p>
                <Table size={'sm'} className={'mb-0 small'}>
                  <tbody>
                    {SCRIPTS.map((script, index) => (
                      <tr key={script}>
                        <td className={'text-nowrap'}><code>{script}</code></td>
                        <td>{t(prefix + 'setup.scripts.' + index)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={5}>
            <Card className={'h-100'}>
              <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'checklist.title')}</h2></Card.Header>
              <Card.Body>
                <ul className={'mb-0'}>
                  {(Array.isArray(checklist) ? checklist as string[] : []).map((item) => <li key={item} className={'mb-1'}>{item}</li>)}
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className={'mt-3'} id={'cite'}>
          <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
            <h2 className={'h5 mb-0'}>{t(prefix + 'cite.title')}</h2>
            <Button size={'sm'} variant={'outline-primary'} onClick={handleClick_Copy}>
              {t(prefix + (copied ? 'cite.copied' : 'cite.copy'))}
            </Button>
          </Card.Header>
          <Card.Body>
            <p>{t(prefix + 'cite.text')}</p>
            <p className={'small'}>
              Mudarra Machuca, A., Valdivia, D., Ducange, P., Germán Morales, M., Rivera Rivas, A. J. and Pérez Godoy, M. D.
              (2024). Nets4Learning: A Web Platform for Designing and Testing ANN/DNN Models. <i>Electronics</i>, 13(22), 4378.{' '}
              <a href={'https://doi.org/10.3390/electronics13224378'} target={'_blank'} rel={'noreferrer'}>doi:10.3390/electronics13224378</a>
            </p>
            <pre className={'n4l-code bg-body-tertiary border rounded p-3 mb-0'}><code>{BIBTEX}</code></pre>
          </Card.Body>
        </Card>

        <h2 className={'h4 mt-4'}>{t(prefix + 'license.title')}</h2>
        <p>{t(prefix + 'license.text')}</p>
        <Accordion>
          <Accordion.Item eventKey={'license'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'license.full')}</Accordion.Header>
            <Accordion.Body>
              <pre className={'mb-0'} style={{ whiteSpace: 'pre-wrap' }}>{LICENSE}</pre>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <h2 className={'h4 mt-4'}>{t(prefix + 'docs.title')}</h2>
        <p className={'text-body-secondary'}>{t(prefix + 'docs.text')}</p>
        <Accordion>
          <Accordion.Item eventKey={'i18n'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'docs.i18n')}</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'i18n.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'directory-structure'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'docs.directory-structure')}</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'directory-structure.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'introduction'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'docs.introduction')}</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'00. Tabular Classification - Introduction.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'add-entry'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'docs.add-entry')}</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'00. Tabular Classification - Add Entry.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'create-model'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>{t(prefix + 'docs.create-model')}</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'00. Tabular Classification - CreateModel.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'dataframe'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>DataFrame</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'_0. DataFrame.md'} /></Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'dataframe-utils'}>
            <Accordion.Header as={'h3'} className={'n4l-accordion-h3'}>DataFrame Utils</Accordion.Header>
            <Accordion.Body><N4LMarkdownDownloader file_name={'DataFrameUtils.md'} /></Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Container>
    </main>
  )
}
