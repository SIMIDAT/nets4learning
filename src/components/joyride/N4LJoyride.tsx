import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Joyride, { type StoreHelpers } from 'react-joyride'

import { VERBOSE } from '@/CONSTANTS'
import { DEFAULT_JOYRIDE_STYLE } from '@/CONSTANTS_JOYRIDE'
import type * as _Types from '@core/types'

type N4LJoyrideProps = {
  joyrideButton_ref: React.Ref<_Types.JoyrideHandle_t>
  JOYRIDE_state?   : _Types.Joyride_t | void
  TASK?            : string
  KEY?             : string
}

export default function N4LJoyride ({ joyrideButton_ref, JOYRIDE_state, TASK = 'DEFAULT', KEY = 'DEFAULT' }: N4LJoyrideProps) {

  const { t } = useTranslation()

  const helpers_ref = useRef<StoreHelpers | null>(null)

  const joyride_locale = {
    back : t('joyride.back'),
    close: t('joyride.close'),
    last : t('joyride.last'),
    next : t('joyride.next'),
    open : t('joyride.open'),
    skip : t('joyride.skip')
  }

  const updateScreenJoyride = useCallback(() => {
    window.dispatchEvent(new Event('resize'))
  }, [])

  useEffect(() => {
    const eventListener_scroll = () => {
      updateScreenJoyride()
    }
    window.addEventListener('scroll', eventListener_scroll, { passive: true })

    return () => window.removeEventListener('scroll', eventListener_scroll, {})
  }, [updateScreenJoyride])

  useEffect(() => {
    if (localStorage.getItem(`${TASK}.joyride-` + KEY) !== null) {
      localStorage.setItem(`${TASK}.joyride-` + KEY, JSON.stringify({ run: true }))
    }
  }, [TASK, KEY])

  useImperativeHandle(joyrideButton_ref, () => ({
    // Reinicia el tour desde el primer paso
    handleClick_StartJoyride: () => helpers_ref.current?.reset(true)
  }), [])

  if(VERBOSE) console.debug('render N4LJoyride')
  return <>
    <Joyride getHelpers={(helpers) => { helpers_ref.current = helpers }}
             styles={DEFAULT_JOYRIDE_STYLE}
             locale={joyride_locale}
             callback={JOYRIDE_state?.handleJoyrideCallback}
             continuous={JOYRIDE_state?.continuous}
             run={JOYRIDE_state?.run}
             steps={JOYRIDE_state?.steps ?? []}
             showProgress={true}
             spotlightClicks={true} />
  </>
}
