import React, { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Form } from 'react-bootstrap'

import * as _Types from '@core/types'
import type { Layer_t as ImageLayer_t } from '@/types/types'
import { VERBOSE } from '@/CONSTANTS'
import NeuralNetwork from './NeuralNetwork'
import type { Network } from 'react-vis-graph-wrapper'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import { NEURAL_NETWORK_MODES } from './neural_network'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'
import N4LMaximizeButton from '@components/maximize/N4LMaximizeButton'
import { useMaximize } from '@components/maximize/useMaximize'

/**
 * @typedef N4LLayerDesignProps_t
 * @property {Array<_Types.CustomParamsLayerModel_t | ImageLayer_t>} layers
 * @property {boolean} [show=true]
 * @property {string} [glossary_action='']
 * @property {string} [manual_action='']
 * @property {Array} [actions=[]]
 */
type N4LLayerDesignProps_t = {
  layers          : Array<_Types.CustomParamsLayerModel_t | ImageLayer_t>;
  show?           : boolean;
  glossary_action?: string;
  manual_action?  : string;
  actions?        : Array<React.ReactNode>;
}
/**
 * 
 * @param {N4LLayerDesignProps_t} props 
 * @returns 
 */
export default function N4LLayerDesign(props: N4LLayerDesignProps_t) {
  const {
    layers,
    show = true,
    glossary_action = '',
    manual_action = '',
    actions = []
  } = props

  const prefix = 'pages.playground.generator.'
  const { t } = useTranslation()

  const [mode, setMode] = useState<"EXTEND" | "COMPACT">(NEURAL_NETWORK_MODES.COMPACT)
  const networkRef = useRef<Network | undefined>(undefined)
  // A pantalla completa se ve mejor una red con muchas capas o en modo extendido
  const maximize = useMaximize()

  const handleChange_mode = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMode = e.target.value as "EXTEND" | "COMPACT"
    setMode(selectedMode)
  }

  if (VERBOSE) console.debug('render N4LLayerDesign')
  return <>
    <Card className={maximize.className}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'layer-design'} /></h3>
        <div className={'d-flex align-items-center gap-2'}>
          <Form.Group controlId={'mode'}>
            <Form.Select
              disabled={show === false}
              aria-label={t(prefix + 'neural_network_modes.title')}
              size={'sm'}
              defaultValue={NEURAL_NETWORK_MODES.COMPACT}
              onChange={(e) => handleChange_mode(e)}>
              <option value={NEURAL_NETWORK_MODES.COMPACT}>{t(prefix + 'neural_network_modes.compact')}</option>
              <option value={NEURAL_NETWORK_MODES.EXTEND}>{t(prefix + 'neural_network_modes.extend')}</option>
            </Form.Select>
          </Form.Group>
          <N4LMaximizeButton maximized={maximize.maximized} onToggle={maximize.toggle} disabled={show === false} />
        </div>
      </Card.Header>
      <Card.Body id={'RegressionLayerDesign'}>
        {show && <>
          <NeuralNetwork
            id_parent={'vis-network'}
            layers={layers}
            mode={mode}
            networkRef={networkRef}
            fill={maximize.maximized}
          />
        </>}
        {!show && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />
        </>}
      </Card.Body>
      {(actions.length > 0 || glossary_action !== '' || manual_action !== '') && <>
        <Card.Footer className={'text-end'}>
          {actions.length > 0 && <>
            <ol
              style={{ listStyleType: 'none' }}
              className='text-muted mb-0'>
              {actions.map((action, index) => {
                return <li key={index}> {action} </li>
              })}
            </ol>
          </>}
          {glossary_action !== '' &&
            <p className={'text-muted mb-0 pb-0'}>
              <Trans
                i18nKey={'more-information-in-link'}
                components={{
                  link1: <N4LHelpLink page={'glossary'} action={glossary_action} />,
                }}
              />
            </p>}
          {manual_action !== '' &&
            <p className={'text-muted mb-0 pb-0'}>
              <Trans
                i18nKey={'more-information-in-tutorial'}
                components={{
                  link1: <N4LHelpLink page={'manual'} action={manual_action} />,
                }}
              />
            </p>
          }
        </Card.Footer>
      </>}
    </Card>
  </>
}

