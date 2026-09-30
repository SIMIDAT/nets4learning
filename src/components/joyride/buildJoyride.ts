import type { TFunction } from 'i18next'
import { ACTIONS, LIFECYCLE, type CallBackProps, type Placement } from 'react-joyride'

import type * as _Types from '@core/types'
import { delay } from '@utils/utils'
import Errors from '@shared/Errors'

export type JoyrideStepSpec_t = {
  /** Clave de i18n del paso: se usan `<prefix><key>.title` y `<prefix><key>.content` */
  key      : string
  /** Selector del elemento que señala el paso */
  target   : string
  placement: Extract<Placement, _Types.JoyrideStep_t['placement']>
  /** Se ejecuta al mostrarse el paso (p. ej. abrir el acordeón donde está el elemento) */
  onShow?  : () => void
}

/**
 * Configuración del tour guiado de una página. Cada paso lleva junto a su selector lo que hay que hacer
 * al mostrarlo, así no se pueden desincronizar.
 */
export function buildJoyride(t: TFunction<'translation', undefined>, prefix: string, steps: JoyrideStepSpec_t[]): _Types.Joyride_t {
  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { action, lifecycle, step } = data
    if (action !== ACTIONS.UPDATE || lifecycle !== LIFECYCLE.TOOLTIP) return
    steps.find(({ target }) => target === step.target)?.onShow?.()
    // Da tiempo a que se abra lo necesario y recoloca el tooltip
    await delay(500)
    if (!window.dispatchEvent(new Event('resize'))) {
      Errors.notDispatchedEvent()
    }
  }

  return {
    run                  : false,
    continuous           : true,
    handleJoyrideCallback: handleJoyrideCallback,
    steps                : steps.map(({ key, target, placement }) => ({
      title  : t(prefix + key + '.title'),
      content: t(prefix + key + '.content'),
      target,
      placement,
    })),
  }
}
