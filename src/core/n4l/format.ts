// Formato .n4l: un paquete con todo lo de un conjunto de datos (sus datos, su ficha y sus textos en cada idioma) y, por
// cada tarea en la que se usa, cómo usarlo en ella (el preprocesado, los modelos ya entrenados con él, el formulario para
// predecir, la red por defecto para entrenar…). Es solo declarativo: describe qué hay y cómo usarlo, y la aplicación lo
// interpreta con el motor que nombra cada tarea (`runtime`). La especificación completa está en docs/n4l-format.md.
//
// Sin alias de importación: lo usa también el plugin de Vite que reúne los paquetes de public/n4l/ (con Node).

import type { TASKS_TYPE_V } from '../../TASKS'

export const N4L_FORMAT = 'n4l'
/** La versión del formato que entiende esta aplicación; los paquetes de versiones anteriores se migran al cargarlos */
export const N4L_FORMAT_VERSION = 1
/** Carpeta de public/ con los paquetes de la aplicación: cada uno, una carpeta <id>.n4l/ */
export const N4L_PACKAGES_DIR = 'n4l'
export const N4L_MANIFEST = 'manifest.json'

export type N4LColumnRole_t = 'Feature' | 'Target' | 'ID' | 'Other'
export type N4LColumnType_t = 'Continuous' | 'Integer' | 'Categorical' | 'Binary'

/** Una columna del conjunto de datos (su ficha): las categóricas, con sus valores en el orden del formulario */
export type N4LColumn_t = {
  name        : string
  role        : N4LColumnRole_t
  type        : N4LColumnType_t
  /** Valores ausentes en el fichero */
  missing     : number
  units?      : string
  /** En inglés, como en la ficha original (UCI…); la traducción, si la hay, va en los textos del paquete */
  description?: string
  options?    : string[]
}

/** Un conjunto en una tabla (un CSV), con la ficha de cada columna. Es el tipo por defecto (sin `kind`) */
export type N4LDataset_t = {
  id     : string
  kind?  : 'table'
  /** Ruta dentro del paquete */
  file   : string
  /** Descripción original del conjunto (p. ej. el .names de UCI), dentro del paquete */
  info?  : string
  rows   : number
  columns: N4LColumn_t[]
}

/**
 * Imágenes en un sprite: un PNG con una imagen por fila (aplanada; primero las de entrenamiento) y, aparte, la clase de
 * cada una en one-hot (un byte por clase), en el mismo orden
 */
export type N4LImageDataset_t = {
  id    : string
  kind  : 'image-sprite'
  /** El PNG, dentro del paquete */
  file  : string
  /** Las clases en one-hot, dentro del paquete */
  labels: string
  info? : string
  /** Imágenes */
  rows  : number
  /** Las primeras `train` son de entrenamiento; las demás, de prueba */
  train : number
  image : { width: number, height: number, channels: number }
}

/** Un conjunto que no va en el paquete (por su tamaño o su licencia): dónde está y cuántas filas o imágenes tiene */
export type N4LExternalDataset_t = {
  id   : string
  kind : 'external'
  url  : string
  info?: string
  rows?: number
}

export type N4LAnyDataset_t = N4LDataset_t | N4LImageDataset_t | N4LExternalDataset_t

export const isTableDataset = (dataset: N4LAnyDataset_t): dataset is N4LDataset_t => dataset.kind === undefined || dataset.kind === 'table'
export const isImageDataset = (dataset: N4LAnyDataset_t): dataset is N4LImageDataset_t => dataset.kind === 'image-sprite'

/** Los ficheros de un conjunto dentro del paquete */
export const n4lDatasetFiles = (dataset: N4LAnyDataset_t): string[] => [
  ...('file' in dataset ? [dataset.file] : []),
  ...('labels' in dataset ? [dataset.labels] : []),
  ...(dataset.info !== undefined ? [dataset.info] : []),
]

/**
 * Una salida del modelo (en su orden): su identificador en el conjunto de datos y otros nombres con que aparece. Si es
 * un carácter (KMNIST), cómo se lee (`reading`, en rōmaji) y el kanji del que viene (`origin`)
 */
export type N4LClass_t = { id: string, aliases?: string[], reading?: string, origin?: string }

/** Paso del preprocesado, por nombre (los registra la aplicación). `columns`: un grupo o una lista de columnas */
export type N4LPreprocessStep_t = {
  op     : string
  columns: 'categorical' | 'features' | string[]
}

/**
 * Lo que recibe un modelo: las columnas codificadas (encoded) o, además, escaladas con el min-max del conjunto (scaled,
 * como los que se entrenan en la aplicación)
 */
export type N4LModelInput_t = 'encoded' | 'scaled'

/** Un modelo de TF.js (LayersModel) del paquete */
export type N4LLayersModel_t = {
  id      : string
  format  : 'tfjs-layers'
  /** El model.json, dentro del paquete (sus pesos, al lado) */
  path    : string
  /** El conjunto con el que se entrenó */
  dataset : string
  /** Tablas: por defecto, encoded. Las imágenes las recibe como están en su conjunto */
  input?  : N4LModelInput_t
  /** Medidas con datos que no vio al entrenar (test_…) */
  metrics?: Record<string, number>
}

/** MobileNet (@tensorflow-models/mobilenet): no va en el paquete, lo descarga la librería en la versión y el ancho dados */
export type N4LMobileNetModel_t = {
  id      : string
  format  : 'tfjs-mobilenet'
  dataset : string
  version : 1 | 2
  alpha   : number
  metrics?: Record<string, number>
}

export type N4LModel_t = N4LLayersModel_t | N4LMobileNetModel_t

export const isLayersModel = (model: N4LModel_t): model is N4LLayersModel_t => model.format === 'tfjs-layers'

/** Un ejemplo para probar el modelo: los valores de entrada y la clase que tiene en el conjunto de datos */
export type N4LExample_t = { values: Record<string, string | number>, expected: string }

/** El formulario para predecir con una tabla: sus valores iniciales y ejemplos */
export type N4LTablePrediction_t = { defaults: Record<string, string | number>, examples: N4LExample_t[] }

/**
 * Una imagen de ejemplo (dentro del paquete) y su clase, si se sabe. Un carácter que antes se escribía de otras formas
 * (KMNIST): `old` en las antiguas, con el kanji del que viene cada una (`origin`)
 */
export type N4LImageExample_t = { file: string, expected?: string, old?: boolean, origin?: string }

/** Las imágenes de ejemplo que se pueden clasificar */
export type N4LImagePrediction_t = { images: N4LImageExample_t[] }

export const isImagePrediction = (prediction: N4LTablePrediction_t | N4LImagePrediction_t): prediction is N4LImagePrediction_t => 'images' in prediction

/** Las capas de la red por defecto al entrenar (las mismas que editan sus editores); `locked`: no se puede cambiar */
export type N4LDenseLayer_t = { class: 'dense', units: number, activation: string, locked?: boolean }
export type N4LConv2DLayer_t = { class: 'conv2d', filters: number, kernelSize: number, activation: string, locked?: boolean }
export type N4LMaxPooling2DLayer_t = { class: 'maxPooling2d', poolSize: number, strides: number, locked?: boolean }
export type N4LFlattenLayer_t = { class: 'flatten', locked?: boolean }
export type N4LLayer_t = N4LDenseLayer_t | N4LConv2DLayer_t | N4LMaxPooling2DLayer_t | N4LFlattenLayer_t

/** Las capas densas (las únicas de las redes de tablas) */
export const denseLayers = (layers: N4LLayer_t[] = []) => layers.filter((layer): layer is N4LDenseLayer_t => layer.class === 'dense')

/** Cómo se usa el paquete en una tarea */
export type N4LTask_t = {
  task         : TASKS_TYPE_V
  /** Clave en las direcciones de la aplicación (/playground/<tarea>/model/<key>) */
  key          : string
  /** Motor de la aplicación que lo interpreta */
  runtime      : string
  /** Los conjuntos que usa (sus id); el primero, el que se abre al entrar */
  datasets     : string[]
  /** Si sale en los menús (por defecto, sí): para tener una tarea preparada sin enseñarla todavía */
  listed?      : boolean
  /** Su posición en los menús de la tarea, de menor a mayor (sin ella, después de los que la tienen) */
  order?       : number
  preprocessing: N4LPreprocessStep_t[]
  /** Clasificación: las salidas del modelo, en orden */
  classes?     : N4LClass_t[]
  models       : N4LModel_t[]
  prediction?  : N4LTablePrediction_t | N4LImagePrediction_t
  /** Para entrenar: la red por defecto y, si se proponen, la tasa de aprendizaje y las épocas con las que se empieza */
  training?    : { layers: N4LLayer_t[], learningRate?: number, epochs?: number }
}

export type N4LManifest_t = {
  $schema?     : string
  format       : typeof N4L_FORMAT
  formatVersion: number
  /** Único: el del conjunto (el nombre de su carpeta, sin .n4l) */
  id           : string
  /** Versión del contenido (semver) */
  version      : string
  /** Idiomas de sus textos: locales/<idioma>.json */
  locales      : string[]
  /** La fuente: su dirección (<link1> en los textos), otras con nombre (<link2>…) y la cita en BibTeX */
  source?      : { url?: string, links?: Record<string, string>, citation?: string }
  datasets     : N4LAnyDataset_t[]
  /** Una por tarea en la que se usa */
  tasks        : N4LTask_t[]
}

/** Los modelos de TF.js de una tarea (los que van en el paquete) */
export const n4lLayersModels = (section: N4LTask_t) => section.models.filter(isLayersModel)

/** El formulario para predecir de una tarea con tablas, si lo tiene */
export const n4lTablePrediction = (section: N4LTask_t) =>
  (section.prediction === undefined || isImagePrediction(section.prediction) ? undefined : section.prediction)

/**
 * Los ficheros que nombra el manifiesto: sus textos, sus conjuntos, sus modelos de TF.js (el model.json; sus pesos los
 * nombra él) y sus imágenes de ejemplo
 */
export const n4lManifestFiles = (manifest: N4LManifest_t): string[] => [...new Set([
  ...manifest.locales.map((language) => `locales/${language}.json`),
  ...manifest.datasets.flatMap(n4lDatasetFiles),
  ...manifest.tasks.flatMap((section) => n4lLayersModels(section).map(({ path }) => path)),
  ...manifest.tasks.flatMap(({ prediction }) => (prediction !== undefined && isImagePrediction(prediction) ? prediction.images.map(({ file }) => file) : [])),
])]

/** Un paquete en una de sus tareas: su sección y sus conjuntos (`dataset`, el primero) */
export type N4LTaskView_t<D extends N4LAnyDataset_t = N4LAnyDataset_t> = { manifest: N4LManifest_t, section: N4LTask_t, datasets: D[], dataset: D }

/** El paquete en esa tarea, si la tiene */
export function n4lTaskView(manifest: N4LManifest_t, task: string): N4LTaskView_t | undefined {
  const section = manifest.tasks.find((item) => item.task === task)
  if (section === undefined) return undefined
  const datasets = section.datasets.flatMap((id) => manifest.datasets.filter((item) => item.id === id))
  return datasets.length === 0 ? undefined : { manifest, section, datasets, dataset: datasets[0] }
}

/** El paquete en esa tarea, si la tiene y todos sus conjuntos son de un tipo (tablas, imágenes…) */
export function n4lTaskViewOf<D extends N4LAnyDataset_t>(manifest: N4LManifest_t, task: string, is: (dataset: N4LAnyDataset_t) => dataset is D) {
  const view = n4lTaskView(manifest, task)
  return view !== undefined && view.datasets.every(is) ? view as N4LTaskView_t<D> : undefined
}

/** El paquete en una tarea con tablas (clasificación tabular, regresión, agrupamiento) */
export const n4lTableView = (manifest: N4LManifest_t, task: string) => n4lTaskViewOf(manifest, task, isTableDataset)

/** Espacio de nombres de i18next con los textos del paquete */
export const n4lNamespace = (id: string) => `n4l-${id}`

/** Prefijo de los textos de una tarea del paquete: `${n4lTaskText(ns, task)}name` → n4l-iris:tasks.clustering.name */
export const n4lTaskText = (namespace: string, task: string) => `${namespace}:tasks.${task}.`

/**
 * Clave de una columna o una clase en los textos del paquete: su nombre, con los «.» y «:» cambiados por «_» (i18next
 * los usa como separadores). «bl. of lymph. c» → «bl_ of lymph_ c»
 */
export const n4lLabelKey = (name: string) => name.replace(/[.:]/g, '_')
