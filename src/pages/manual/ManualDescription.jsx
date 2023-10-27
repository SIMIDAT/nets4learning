import React from 'react'
import { Trans } from 'react-i18next'
import { Card } from 'react-bootstrap'
import { VERBOSE } from '@/CONSTANTS'

export default function ManualDescription () {

  if (VERBOSE) console.debug('render ManualDescription')
  return <>
    <Card border={'primary'}>
      <Card.Header><h3><Trans i18nKey={'pages.manual.app.title'} /></h3></Card.Header>
      <Card.Body>
        <Card.Text><Trans i18nKey={'pages.manual.app.description-1'} /></Card.Text>
        <Card.Text><Trans i18nKey={'pages.manual.app.description-2'} /></Card.Text>
        <ol>
          <li><b><Trans i18nKey={'pages.manual.app.list.0.title'} />: </b> <Trans i18nKey={'pages.manual.app.list.0.description'} /></li>
          <li><b><Trans i18nKey={'pages.manual.app.list.1.title'} />: </b> <Trans i18nKey={'pages.manual.app.list.1.description'} /></li>
          <li><b><Trans i18nKey={'pages.manual.app.list.2.title'} />: </b> <Trans i18nKey={'pages.manual.app.list.2.description'} /></li>
        </ol>
        <Card.Text><Trans i18nKey={'pages.manual.app.description-3'} /></Card.Text>
        <Card.Text><Trans i18nKey={'pages.manual.app.description-4'} /></Card.Text>
      </Card.Body>
    </Card>
  </>
}