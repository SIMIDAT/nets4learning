import React from 'react'
import { Trans } from 'react-i18next'
import { VERBOSE } from '@/CONSTANTS'

export default function N4LDivider (props = { i18nKey: '' }) {
  const { i18nKey } = props

  if (VERBOSE) console.debug('render N4LDivider')
  return <>
    <div className={`mt-3 mb-4 n4l-hr-row`}>
      <p><span className={'n4l-hr-title'}><Trans i18nKey={i18nKey} /></span></p>
    </div>
  </>
}