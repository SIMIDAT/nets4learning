import type { GuidePlacement_t, GuideStep_t } from './N4LGuide'

/** Un paso de la guía de una página: su clave de i18n, el elemento que señala y dónde va el bocadillo */
export type GuideStepSpec_t = {
  key       : string
  target    : string
  placement?: GuidePlacement_t
}

/** i18next acepta varias claves: devuelve la primera que existe */
export type GuideTranslate_t = (keys: string | string[]) => string

/**
 * Los pasos de la guía de un modelo, con sus textos: los de ese modelo (`<prefix>.<model>.<key>`) y, si no los tiene,
 * los comunes a todos los de su tarea (`<prefix>.common.<key>`), para las partes de la página que son iguales.
 */
export function buildGuideSteps(t: GuideTranslate_t, prefix: string, model: string, specs: GuideStepSpec_t[]): GuideStep_t[] {
  const text = (key: string, part: 'title' | 'content') => t([`${prefix}.${model}.${key}.${part}`, `${prefix}.common.${key}.${part}`])
  return specs.map(({ key, target, placement = 'auto' }) => ({
    target,
    placement,
    title  : text(key, 'title'),
    content: text(key, 'content'),
  }))
}

/** Primer y último paso, en medio de la pantalla */
export const centerStep = (key: string): GuideStepSpec_t => ({ key, target: 'body', placement: 'center' })

/** Un paso que señala el elemento con ese data-guide */
export const guideStep = (key: string, guide: string, placement?: GuidePlacement_t): GuideStepSpec_t =>
  ({ key, target: `[data-guide="${guide}"]`, placement })
