import { Accordion } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import React from 'react'

export default function GlossaryEditor () {

  const { t } = useTranslation()

  return <>
    <Accordion defaultValue={''} defaultActiveKey={''}>
      <Accordion.Item eventKey={'item-0'}>
        <Accordion.Header><h2><Trans>pages.glossary.editor-layers.title</Trans></h2></Accordion.Header>
        <Accordion.Body>
          {Object.entries(t('pages.glossary.editor-layers.table', { returnObjects: true }))
            .map(([info_key, info_value], index) => {
              const { title, description } = /** @type {title: string, description: string} */ info_value
              return <div key={index}>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            })}
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey={'item-1'}>
        <Accordion.Header><h2><Trans>pages.glossary.editor-hyperparameters.title</Trans></h2></Accordion.Header>
        <Accordion.Body>

          {Object.entries(t('pages.glossary.editor-hyperparameters.table', { returnObjects: true }))
            .map(([info_key, info_value], index) => {
              const { title, description } = /** @type {title: string, description: string} */ info_value
              return <div key={index}>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            })}

        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  </>
}