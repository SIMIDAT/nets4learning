import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Form } from 'react-bootstrap'

import * as _Types from '@core/types'
import { VERBOSE } from '@/CONSTANTS'
import { NEURAL_NETWORK_MODES, NeuralNetwork } from './NeuralNetwork'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

/**
 * @typedef N4LLayerDesignProps_t
 * @property {Array<_Types.CustomParamsLayerModel_t>} layers
 * @property {boolean} [show=true]
 * @property {string} [glossary_action='']
 * @property {string} [manual_action='']
 * @property {Array} [actions=[]]
 */

/**
 * 
 * @param {N4LLayerDesignProps_t} props 
 * @returns 
 */
export default function N4LLayerDesign(props) {
  const {
    layers,
    show = true,
    glossary_action = '',
    manual_action = '', 
    actions = []
  } = props

  const prefix = 'pages.playground.generator.'
  const { t } = useTranslation()

  const [mode, setMode] = useState(NEURAL_NETWORK_MODES.COMPACT)
  const networkRef = useRef()

  const handleChange_mode = async (e) => {
    setMode(e.target.value)
  }

  if (VERBOSE) console.debug('render N4LLayerDesign')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'layer-design'} /></h3>
        <div className={'ms-3'}>
          <Form.Group controlId={'mode'}>
            <Form.Select disabled={show === false}
                         aria-label={t(prefix + 'neural_network_modes.title')}
                         size={'sm'}
                         defaultValue={NEURAL_NETWORK_MODES.COMPACT}
                         onChange={(e) => handleChange_mode(e)}>
              <option value={NEURAL_NETWORK_MODES.COMPACT}>{t(prefix + 'neural_network_modes.compact')}</option>
              <option value={NEURAL_NETWORK_MODES.EXTEND}>{t(prefix + 'neural_network_modes.extend')}</option>
            </Form.Select>
          </Form.Group>
        </div>
      </Card.Header>
      <Card.Body id={'RegressionLayerDesign'}>
        {show && <>
        <NeuralNetwork id_parent={'vis-network'}
                       layers={layers}
                       mode={mode}
                       networkRef={networkRef} />
        </>}
        {!show && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
        </>}
      </Card.Body>
      {(actions.length > 0 || glossary_action !== '' || manual_action !== '' ) && <>
        <Card.Footer className={'text-end'}>
          {actions.length > 0 && <>
            <ol style={{listStyleType: 'none'}} className='text-muted mb-0'>
              {actions.map((action, index) => <li key={index}> {action} </li>)}
            </ol>
          </>}
          {glossary_action !== '' &&
            <p className={'text-muted mb-0 pb-0'}>
              <Trans i18nKey={'more-information-in-link'}
                components={{
                  link1: <Link className={'text-info'}
                    state={{
                      action: glossary_action,
                    }}
                    to={{
                      pathname: '/glossary/',
                    }} />,
                }} />
            </p>}
          {manual_action !== '' &&
            <p className={'text-muted mb-0 pb-0'}>
              <Trans i18nKey={'more-information-in-tutorial'}
                components={{
                  link1: <Link className={'text-info'}
                    state={{
                      action: manual_action,
                    }}
                    to={{
                      pathname: '/manual/',
                    }} />,
                }} />
            </p>
          }
        </Card.Footer>
      </>}
    </Card>
  </>
}

