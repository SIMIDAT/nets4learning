import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Joyride from 'react-joyride'

import { VERBOSE } from '@/CONSTANTS'
import { DEFAULT_JOYRIDE_STYLE } from "@/CONSTANTS_JOYRIDE";

export default function N4LJoyride ({ refJoyrideButton, JOYRIDE_state = {}, TASK = 'DEFAULT', KEY = 'DEFAULT' }) {

  const { t } = useTranslation()

  const [joyride, setJoyride] = useState({  })
  const joyrideRef = useRef()

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
    joyrideRef.current?.store.reset()
    joyrideRef.current?.store.start()
  }

  useImperativeHandle(refJoyrideButton, () => ({
    handleClick_StartJoyride
  }), [])

  if(VERBOSE) console.debug('render N4LJoyride')
  return <>
    <Joyride ref={joyrideRef}
             style={DEFAULT_JOYRIDE_STYLE}
             locale={joyride_locale}
             callback={joyride.handleJoyrideCallback}
             continuous={joyride.continuous}
             run={joyride.run}
             steps={joyride.steps}
             showProgress={true}
             spotlightClicks={true} />
  </>
}