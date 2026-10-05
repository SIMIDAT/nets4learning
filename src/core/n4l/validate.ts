// Validación del manifest.json de un paquete .n4l (ya migrado a la versión actual del formato): devuelve todos los
// problemas a la vez, cada uno con dónde está, para poder arreglarlos de una pasada. Sin alias de importación (también
// lo usa el plugin de Vite).

import { N4L_FORMAT, N4L_FORMAT_VERSION } from './format'

const TASKS = ['tabular-classification', 'regression', 'image-classification', 'object-detection', 'clustering']
const ROLES = ['Feature', 'Target', 'ID', 'Other']
const TYPES = ['Continuous', 'Integer', 'Categorical', 'Binary']
const KINDS = ['table', 'image-sprite', 'external']
const MODEL_FORMATS = ['tfjs-layers', 'tfjs-mobilenet']
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Rutas dentro del paquete: relativas y sin salir de él
const INNER_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\]+$/

export class N4LError extends Error {
  readonly problems: string[]

  constructor(id: string, problems: string[]) {
    super(`Paquete .n4l no válido (${id}):\n- ${problems.join('\n- ')}`)
    this.name = 'N4LError'
    this.problems = problems
  }
}

type Json_t = Record<string, unknown>
const isObject = (value: unknown): value is Json_t => typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string' && value !== ''
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const isInnerPath = (value: unknown) => isString(value) && INNER_PATH.test(value)

/** Cada capa de la red por defecto, con lo suyo */
const LAYERS: Record<string, (layer: Json_t) => boolean> = {
  dense       : (layer) => isCount(layer.units) && isString(layer.activation),
  conv2d      : (layer) => isCount(layer.filters) && isCount(layer.kernelSize) && isString(layer.activation),
  maxPooling2d: (layer) => isCount(layer.poolSize) && isCount(layer.strides),
  flatten     : () => true,
}

/** Los problemas del manifiesto; vacío si es válido */
export function manifestProblems(raw: unknown): string[] {
  const problems: string[] = []
  const check = (condition: boolean, message: string) => { if (!condition) problems.push(message) }
  if (!isObject(raw)) return ['manifest.json no es un objeto JSON']
  const manifest = raw

  check(manifest.format === N4L_FORMAT, `format: tiene que ser "${N4L_FORMAT}"`)
  check(manifest.formatVersion === N4L_FORMAT_VERSION, `formatVersion: tiene que ser ${N4L_FORMAT_VERSION}`)
  check(isString(manifest.id) && ID.test(manifest.id), 'id: minúsculas, números y guiones (el del conjunto)')
  check(isString(manifest.version) && SEMVER.test(manifest.version), 'version: semver (1.0.0)')
  check(Array.isArray(manifest.locales) && manifest.locales.length > 0 && manifest.locales.every(isString), 'locales: al menos un idioma')
  if (manifest.source !== undefined) {
    check(isObject(manifest.source), 'source: un objeto ({ url, links, citation })')
    const links = isObject(manifest.source) ? manifest.source.links : undefined
    if (links !== undefined) check(isObject(links) && Object.values(links).every(isString), 'source.links: { nombre: dirección }')
  }

  // Los conjuntos y sus fichas: tablas (por defecto), sprites de imágenes o externos (no van en el paquete)
  check(Array.isArray(manifest.datasets) && manifest.datasets.length > 0, 'datasets: al menos un conjunto')
  const columnsOf = new Map<string, Json_t[]>()
  list(manifest.datasets).forEach((dataset, i) => {
    const at = `datasets[${i}]`
    if (!isObject(dataset)) return problems.push(`${at}: no es un objeto`)
    const kind = (dataset.kind ?? 'table') as string
    check(isString(dataset.id), `${at}.id: falta`)
    check(KINDS.includes(kind), `${at}.kind: uno de ${KINDS.join(', ')} (por defecto, table)`)
    columnsOf.set(dataset.id as string, [])
    if (dataset.info !== undefined) check(isInnerPath(dataset.info), `${at}.info: ruta dentro del paquete`)
    if (kind === 'external') {
      check(isString(dataset.url), `${at}.url: dónde está el conjunto`)
      if (dataset.rows !== undefined) check(isCount(dataset.rows), `${at}.rows: número de filas o imágenes`)
      return
    }
    check(isInnerPath(dataset.file), `${at}.file: ruta dentro del paquete`)
    check(isCount(dataset.rows), `${at}.rows: número de filas`)
    if (kind === 'image-sprite') {
      check(isInnerPath(dataset.labels), `${at}.labels: ruta dentro del paquete (las clases en one-hot)`)
      check(isCount(dataset.train) && (dataset.train as number) < (dataset.rows as number), `${at}.train: las primeras filas, de entrenamiento (menos que rows)`)
      const image = dataset.image
      check(isObject(image) && isCount(image.width) && isCount(image.height) && isCount(image.channels), `${at}.image: { width, height, channels }`)
      return
    }
    const columns = list(dataset.columns).filter(isObject)
    columnsOf.set(dataset.id as string, columns)
    check(columns.length > 0, `${at}.columns: al menos una columna`)
    check(columns.filter((column) => column.role === 'Target').length <= 1, `${at}.columns: como mucho un objetivo (role Target)`)
    list(dataset.columns).forEach((column, j) => {
      const atColumn = `${at}.columns[${j}]`
      if (!isObject(column)) return problems.push(`${atColumn}: no es un objeto`)
      check(isString(column.name), `${atColumn}.name: falta`)
      check(ROLES.includes(column.role as string), `${atColumn}.role: uno de ${ROLES.join(', ')}`)
      check(TYPES.includes(column.type as string), `${atColumn}.type: uno de ${TYPES.join(', ')}`)
      check(Number.isInteger(column.missing) && (column.missing as number) >= 0, `${atColumn}.missing: número de valores ausentes`)
      if (column.options !== undefined) check(Array.isArray(column.options) && column.options.every(isString), `${atColumn}.options: lista de valores`)
    })
  })

  // Cada tarea: una sección por tarea, con su clave, su motor y lo que usa del paquete
  check(Array.isArray(manifest.tasks) && manifest.tasks.length > 0, 'tasks: al menos una tarea')
  const seen = new Set<string>()
  list(manifest.tasks).forEach((section, i) => {
    const at = `tasks[${i}]`
    if (!isObject(section)) return problems.push(`${at}: no es un objeto`)
    check(TASKS.includes(section.task as string), `${at}.task: una de ${TASKS.join(', ')}`)
    check(!seen.has(section.task as string), `${at}.task: ${section.task as string} ya tiene su sección`)
    seen.add(section.task as string)
    check(isString(section.key), `${at}.key: la clave en las direcciones de la aplicación`)
    check(isString(section.runtime), `${at}.runtime: el motor que lo interpreta`)
    const used = list(section.datasets)
    check(used.length > 0 && used.every((id) => columnsOf.has(id as string)), `${at}.datasets: al menos uno, de los conjuntos del paquete`)
    if (section.listed !== undefined) check(typeof section.listed === 'boolean', `${at}.listed: true o false`)
    if (section.order !== undefined) check(Number.isInteger(section.order), `${at}.order: un número entero`)
    // Una columna de un paso tiene que estar en alguno de sus conjuntos
    const columnNames = new Set(used.flatMap((id) => (columnsOf.get(id as string) ?? []).map(({ name }) => name)))

    check(Array.isArray(section.preprocessing), `${at}.preprocessing: una lista de pasos (puede estar vacía)`)
    list(section.preprocessing).forEach((step, j) => {
      const atStep = `${at}.preprocessing[${j}]`
      check(isObject(step) && isString(step.op), `${atStep}.op: el nombre del paso`)
      const columns = isObject(step) ? step.columns : undefined
      const isGroup = columns === 'categorical' || columns === 'features'
      check(isGroup || (Array.isArray(columns) && columns.every(isString)), `${atStep}.columns: "categorical", "features" o una lista de columnas`)
      if (Array.isArray(columns)) {
        const unknown = columns.filter((name) => !columnNames.has(name as string))
        check(unknown.length === 0, `${atStep}.columns: no están en el conjunto: ${unknown.join(', ')}`)
      }
    })

    if (section.classes !== undefined) {
      check(Array.isArray(section.classes) && section.classes.length > 0, `${at}.classes: al menos una clase`)
      list(section.classes).forEach((item, j) => {
        check(isObject(item) && isString(item.id), `${at}.classes[${j}].id: falta`)
        if (isObject(item) && item.aliases !== undefined) check(Array.isArray(item.aliases) && item.aliases.every(isString), `${at}.classes[${j}].aliases: lista de nombres`)
        for (const key of ['reading', 'origin']) {
          if (isObject(item) && item[key] !== undefined) check(isString(item[key]), `${at}.classes[${j}].${key}: un texto`)
        }
      })
    }

    check(Array.isArray(section.models), `${at}.models: una lista (puede estar vacía)`)
    list(section.models).forEach((model, j) => {
      const atModel = `${at}.models[${j}]`
      if (!isObject(model)) return problems.push(`${atModel}: no es un objeto`)
      check(isString(model.id), `${atModel}.id: falta`)
      check(MODEL_FORMATS.includes(model.format as string), `${atModel}.format: uno de ${MODEL_FORMATS.join(', ')}`)
      if (model.format === 'tfjs-layers') check(isInnerPath(model.path), `${atModel}.path: ruta dentro del paquete`)
      if (model.format === 'tfjs-mobilenet') {
        check(model.version === 1 || model.version === 2, `${atModel}.version: 1 o 2`)
        check(typeof model.alpha === 'number' && model.alpha > 0, `${atModel}.alpha: el ancho de la red (1, 0.75…)`)
      }
      check(columnsOf.has(model.dataset as string), `${atModel}.dataset: uno de los conjuntos del paquete`)
      if (model.input !== undefined) check(model.input === 'encoded' || model.input === 'scaled', `${atModel}.input: "encoded" o "scaled"`)
      if (model.metrics !== undefined) {
        check(isObject(model.metrics) && Object.values(model.metrics).every((value) => typeof value === 'number' && Number.isFinite(value)), `${atModel}.metrics: números`)
      }
    })

    if (section.prediction !== undefined) {
      const prediction = section.prediction
      const classIds = new Set(list(section.classes).filter(isObject).flatMap((item) => [item.id, ...list(item.aliases)]))
      if (isObject(prediction) && prediction.images !== undefined) {
        // Imágenes de ejemplo
        check(Array.isArray(prediction.images), `${at}.prediction.images: una lista`)
        list(prediction.images).forEach((image, j) => {
          const atImage = `${at}.prediction.images[${j}]`
          if (!isObject(image)) return problems.push(`${atImage}: no es un objeto`)
          check(isInnerPath(image.file), `${atImage}.file: ruta dentro del paquete`)
          if (image.expected !== undefined && classIds.size > 0) check(classIds.has(image.expected), `${atImage}.expected: una de las clases`)
          if (image.old !== undefined) check(typeof image.old === 'boolean', `${atImage}.old: true o false`)
          if (image.origin !== undefined) check(isString(image.origin), `${atImage}.origin: un texto`)
        })
      } else {
        // El formulario de una tabla
        check(isObject(prediction) && isObject(prediction.defaults), `${at}.prediction.defaults: los valores iniciales del formulario`)
        check(isObject(prediction) && Array.isArray(prediction.examples), `${at}.prediction.examples: una lista`)
        list(isObject(prediction) ? prediction.examples : undefined).forEach((example, j) => {
          check(isObject(example) && isObject(example.values), `${at}.prediction.examples[${j}].values: falta`)
          if (classIds.size > 0) check(isObject(example) && classIds.has(example.expected), `${at}.prediction.examples[${j}].expected: una de las clases`)
        })
      }
    }

    if (section.training !== undefined) {
      const layers = isObject(section.training) && Array.isArray(section.training.layers) ? section.training.layers : null
      check(layers !== null && layers.length > 0, `${at}.training.layers: al menos una capa`)
      const training = isObject(section.training) ? section.training : {}
      if (training.learningRate !== undefined) check(typeof training.learningRate === 'number' && training.learningRate > 0, `${at}.training.learningRate: un número mayor que 0`)
      if (training.epochs !== undefined) check(isCount(training.epochs), `${at}.training.epochs: un número entero mayor que 0`)
      list(layers).forEach((layer, j) => {
        const atLayer = `${at}.training.layers[${j}]`
        if (!isObject(layer)) return problems.push(`${atLayer}: no es un objeto`)
        const valid = LAYERS[layer.class as string]
        check(valid !== undefined, `${atLayer}.class: una de ${Object.keys(LAYERS).join(', ')}`)
        if (valid !== undefined) {
          check(valid(layer), `${atLayer}: dense { units, activation }, conv2d { filters, kernelSize, activation }, maxPooling2d { poolSize, strides } o flatten`)
        }
        check(layer.locked === undefined || typeof layer.locked === 'boolean', `${atLayer}.locked: true o false`)
      })
    }
  })
  return problems
}

/** El manifiesto, si es válido; si no, N4LError con todos los problemas */
export function validateManifest<T>(raw: unknown): T {
  const problems = manifestProblems(raw)
  if (problems.length > 0) throw new N4LError(isObject(raw) && isString(raw.id) ? raw.id : '?', problems)
  return raw as T
}
