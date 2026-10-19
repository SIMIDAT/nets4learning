import React, { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { Trans } from 'react-i18next'

import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

type DescriptionModalProps_t = {
  showDescription   : boolean
  setShowDescription: (show: boolean) => void
}

type DataFrameCardProps = {
  /** Clave de i18n del título */
  title       : string
  /** false: todavía no hay dataframe que mostrar y se ve la espera */
  ready?      : boolean
  /** Botón de la cabecera que abre un modal explicando la herramienta */
  description?: { buttonKey: string, Modal: React.ComponentType<DescriptionModalProps_t> }
  children    : React.ReactNode
}

/** Tarjeta de las herramientas de análisis de un dataframe: título, descripción opcional y contenido. */
export default function DataFrameCard({ title, ready = true, description, children }: DataFrameCardProps) {
  const [showDescription, setShowDescription] = useState(false)
  return <>
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3><Trans i18nKey={title} /></h3>
        {description && (
          <div className={'d-flex'}>
            <Button variant={'outline-primary'} size={'sm'} onClick={() => setShowDescription(true)}>
              <Trans i18nKey={description.buttonKey} />
            </Button>
          </div>
        )}
      </Card.Header>
      <Card.Body>
        {ready ? children : <WaitingPlaceholder i18nKey_title={'Waiting'} />}
      </Card.Body>
    </Card>
    {description && <description.Modal showDescription={showDescription} setShowDescription={setShowDescription} />}
  </>
}
