// @ts-nocheck
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Joyride from 'react-joyride'

import { VERBOSE } from '@/CONSTANTS'
import { DEFAULT_JOYRIDE_STYLE } from '@/CONSTANTS_JOYRIDE'

export default function N4LJoyride ({ joyrideButton_ref, JOYRIDE_state = {}, TASK = 'DEFAULT', KEY = 'DEFAULT' }) {

  const { t } = useTranslation()

  const [joyride, setJoyride] = useState({  })
  const joyride_ref = useRef()

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

    setJoyride(JOYRIDE_state)

    if (localStorage.getItem(`${TASK}.joyride-` + KEY) !== null) {
      localStorage.setItem(`${TASK}.joyride-` + KEY, JSON.stringify({ run: true }))
    }
  }, [JOYRIDE_state, TASK, KEY])

  const handleClick_StartJoyride = () => {
    if (joyride_ref && joyride_ref.current) {
      joyride_ref.current?.store.reset()
      joyride_ref.current?.store.start()
    }
  }

  useImperativeHandle(joyrideButton_ref, () => ({
    handleClick_StartJoyride
  }), [])

  if(VERBOSE) console.debug('render N4LJoyride')
  return <>
    <Joyride ref={joyride_ref}
             styles={DEFAULT_JOYRIDE_STYLE}
             locale={joyride_locale}
             callback={joyride.handleJoyrideCallback}
             continuous={joyride.continuous}
             run={joyride.run}
             steps={joyride.steps}
             showProgress={true}
             spotlightClicks={true} />
  </>
}