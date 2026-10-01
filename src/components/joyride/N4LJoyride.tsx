import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Joyride, { type StoreHelpers } from 'react-joyride'

import { VERBOSE } from '@/CONSTANTS'
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

  // El tour arranca solo la primera vez que se entra en la página; después, con el botón "Activar el tutorial"
  const [run, setRun] = useState(JOYRIDE_state?.run ?? false)
  useEffect(() => {
    const storageKey = `${TASK}.joyride-` + KEY
    try {
      if (localStorage.getItem(storageKey) !== null) return
      // Se marca como visto al empezar: aunque se cierre a medias, no vuelve a salir solo
      localStorage.setItem(storageKey, JSON.stringify({ seen: true }))
    } catch {
      // Sin localStorage no se puede recordar: mejor no arrancarlo en cada visita
      return
    }
    // Deja que la página pinte los elementos que señala el tour
    const timeout = setTimeout(() => setRun(true), 1000)
    return () => clearTimeout(timeout)
  }, [TASK, KEY])

  useImperativeHandle(joyrideButton_ref, () => ({
    // Reinicia el tour desde el primer paso
    handleClick_StartJoyride: () => {
      setRun(true)
      helpers_ref.current?.reset(true)
    }
  }), [])

  if(VERBOSE) console.debug('render N4LJoyride')
  return <>
    <Joyride getHelpers={(helpers) => { helpers_ref.current = helpers }}
             locale={joyride_locale}
             callback={JOYRIDE_state?.handleJoyrideCallback}
             continuous={JOYRIDE_state?.continuous}
             run={run}
             steps={JOYRIDE_state?.steps ?? []}
             showProgress={true}
             spotlightClicks={true} />
  </>
}
