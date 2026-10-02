/** Dónde está el usuario: va en todos los eventos de analíticas (ver docs/analytics.md) */
export type PageContext_t = {
  page_type: string
  task?    : string
  mode?    : string
  item?    : string
}

const PAGE_TYPES: Record<string, string> = {
  ''                    : 'home',
  'home'                : 'home',
  'manual'              : 'manual',
  'glossary'            : 'glossary',
  'datasets'            : 'datasets',
  'analyze'             : 'analyze',
  'contribute'          : 'contribute',
  'terms-and-conditions': 'terms',
  'version'             : 'version',
  'settings'            : 'settings',
  '404'                 : 'not_found',
  'debug'               : 'dev',
}

// En la URL, "dataset" es entrenar con un conjunto de datos y "model" probar uno ya entrenado
const MODES: Record<string, string> = { dataset: 'train', model: 'pretrained' }

/**
 * El contexto de una ruta de la aplicación (sin el basename): qué página es y, en el playground, la tarea, si se entrena
 * o se prueba un modelo y cuál.
 */
export function pageContextFromPath(pathname: string, search = ''): PageContext_t {
  const [first = '', ...rest] = pathname.split('/').filter((part) => part !== '').map(decodeURIComponent)
  if (first === 'select-dataset' || first === 'select-model') {
    return { page_type: first.replace('-', '_'), task: rest[0] }
  }
  if (first === 'playground') {
    if (rest[0] === 'description-regression') return { page_type: 'regression_description', task: 'regression' }
    return { page_type: 'playground', task: rest[0], mode: MODES[rest[1]] ?? rest[1], item: rest[2] }
  }
  if (first === 'analyze') {
    const dataset = new URLSearchParams(search).get('dataset')
    return dataset === null ? { page_type: 'analyze' } : { page_type: 'analyze', item: dataset }
  }
  if (first.startsWith('test-page')) return { page_type: 'dev' }
  return { page_type: PAGE_TYPES[first] ?? 'other' }
}

/** El título con el que sale la página en los informes: estable, sin depender del idioma */
export function pageTitle({ page_type, task, mode, item }: PageContext_t): string {
  return [page_type, task, mode, item].filter((part) => part !== undefined).join(' / ')
}

// Lo que se puede pulsar
const CLICKABLE = [
  '[data-analytics]',
  'button',
  'a[href]',
  'summary',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
].join(', ')

/**
 * Cómo se llama en las analíticas lo que se ha pulsado: su data-analytics, su data-testid o su id (los de useId de React,
 * con ":", cambian en cada visita y no sirven). Un enlace interno sin nada de eso, por su ruta. Si no hay nombre estable
 * (o es un enlace a otra web, que ya mide GA, o un href="#"), null: no se envía.
 */
export function clickTargetName(target: EventTarget | null, basename = ''): string | null {
  if (!(target instanceof Element)) return null
  const element = target.closest(CLICKABLE)
  if (element === null) return null
  const name = element.getAttribute('data-analytics') ?? element.getAttribute('data-testid')
  if (name) return name
  if (element.id && !element.id.includes(':')) return element.id
  // Los href="#" (los elementos de los menús desplegables) no llevan a ninguna página
  if (element instanceof HTMLAnchorElement && !element.getAttribute('href')?.startsWith('#')) {
    const url = new URL(element.href, window.location.href)
    if (url.origin !== window.location.origin) return null
    const path = basename !== '' && url.pathname.startsWith(basename) ? url.pathname.slice(basename.length) : url.pathname
    return 'link:' + (path === '' ? '/' : path)
  }
  return null
}
