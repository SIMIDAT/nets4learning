import React from 'react'
import { Accordion, Card, Col, Container, Row } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import N4LMarkdownDownloader from '@components/markdown/N4LMarkdownDownloader'
import N4LDivider from '@components/divider/N4LDivider'
import { VERBOSE } from '@/CONSTANTS'

export default function Contribute () {

  const prefix = 'pages.contribute.'

  if (VERBOSE) console.debug('render Contribute')
  return <>
    <main className={'mb-3'} data-title={'Contribute'}>
      <Container>
        <Row className={'mt-3'}>
          <Col><h1><Trans i18nKey={prefix + 'title'} /></h1></Col>
        </Row>
        <Row className={'mt-3'}>
          <Col>

            <Card border={'primary'}>
              <Card.Header><h2><Trans i18nKey={prefix + 'license.title'} /></h2></Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{`The MIT License (MIT)

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
SOFTWARE.`}</pre>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer className={'d-flex justify-content-end'}>
                <p className={'text-muted mb-0 pb-0'}>
                  <Trans i18nKey={'more-information-in-link'}
                         components={{
                           link1: <a className={'text-info'} href={'https://github.com/SIMIDAT'}>link</a>,
                         }} />
                </p>
              </Card.Footer>
            </Card>

            <N4LDivider i18nKey={'hr.project'} />
            <Accordion className={'mt-3'}>
              <Accordion.Item eventKey={'i18n'}>
                <Accordion.Header>
                  <h3>Localization (i18n)</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'i18n.md'} />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <N4LDivider i18nKey={'hr.add-model-dataset'} />
            <Accordion className={'mt-3'}>
              <Accordion.Item eventKey={'directory-structure'}>
                <Accordion.Header>
                  <h3>Directory structure</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'directory-structure.md'} />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'Example Pre-processing'}>
                <Accordion.Header>
                  <h3>Introduction</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'00. Tabular Classification - Introduction.md'} />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'Example Add Entry'}>
                <Accordion.Header>
                  <h3>Add Entry</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'00. Tabular Classification - Add Entry.md'} />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'Create Model'}>
                <Accordion.Header>
                  <h3>Create model</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'00. Tabular Classification - CreateModel.md'} />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            <N4LDivider i18nKey={'hr.dataframe'} />
            <Accordion className={'mt-3'}>
              <Accordion.Item eventKey={'DataFrame'}>
                <Accordion.Header>
                  <h3>DataFrame</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'_0. DataFrame.md'} />
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey={'DataFrameUtils'}>
                <Accordion.Header>
                  <h3>DataFrame Utils</h3>
                </Accordion.Header>
                <Accordion.Body>
                  <N4LMarkdownDownloader file_name={'DataFrameUtils.md'} />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

          </Col>
        </Row>
      </Container>
    </main>
  </>
}