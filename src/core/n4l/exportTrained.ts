import * as tfjs from '@tensorflow/tfjs'

import { isImagePrediction, n4lLayersModels, N4L_MANIFEST, type N4LClass_t, type N4LLayer_t, type N4LManifest_t, type N4LModelInput_t, type N4LTask_t } from './format'
import { n4lPackageFiles } from './export'
import { packN4L, type N4LPackage_t } from './source'

// Un modelo entrenado en la aplicación, en un .n4l: el paquete de su conjunto (datos, ficha, textos, preprocesado) con
// ese modelo en lugar de los que traía. Se abre después en el menú de modelos como cualquier otro paquete.

const TRAINED_PATH = 'models/trained/model.json'
const TRAINED_WEIGHTS = 'model.weights.bin'

export type TrainedModel_t = {
  model  : tfjs.LayersModel
  /** Sus capas: serán la red por defecto al entrenar con el paquete */
  layers : N4LLayer_t[]
  /** Las clases en el orden de sus salidas (las del conjunto preparado) */
  classes: string[]
  /** Su número en la tabla de modelos */
  number : number
  /** Las métricas de la última época */
  metrics: Record<string, number>
  /** Lo que recibe, si es una tabla (los entrenados en la aplicación, escalada) */
  input? : N4LModelInput_t
}

/** Los ejemplos para predecir que son de alguna de las clases (las imágenes sin clase, también) */
function keepExamples(prediction: N4LTask_t['prediction'], classes: N4LClass_t[]): Pick<N4LTask_t, 'prediction'> {
  if (prediction === undefined) return {}
  const known = (expected: string) => classes.some(({ id, aliases = [] }) => id === expected || aliases.includes(expected))
  return isImagePrediction(prediction)
    ? { prediction: { images: prediction.images.filter(({ expected }) => expected === undefined || known(expected)) } }
    : { prediction: { ...prediction, examples: prediction.examples.filter(({ expected }) => known(expected)) } }
}

/** El model.json y los pesos del modelo, sin descargarlos */
async function modelFiles(model: tfjs.LayersModel): Promise<Record<string, string | ArrayBuffer>> {
  let artifacts: tfjs.io.ModelArtifacts | null = null
  await model.save(tfjs.io.withSaveHandler(async (saved) => {
    artifacts = saved
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
  }))
  const { modelTopology, weightSpecs = [], weightData } = artifacts! as tfjs.io.ModelArtifacts
  const weights = Array.isArray(weightData) ? weightData : [weightData ?? new ArrayBuffer(0)]
  const modelJson = {
    modelTopology,
    format         : 'layers-model',
    generatedBy    : `TensorFlow.js tfjs-layers v${tfjs.version.tfjs}`,
    convertedBy    : null,
    weightsManifest: [{ paths: [TRAINED_WEIGHTS], weights: weightSpecs }],
  }
  const bytes = new Uint8Array(weights.reduce((total, buffer) => total + buffer.byteLength, 0))
  weights.reduce((offset, buffer) => {
    bytes.set(new Uint8Array(buffer), offset)
    return offset + buffer.byteLength
  }, 0)
  return { [TRAINED_PATH]: JSON.stringify(modelJson), ['models/trained/' + TRAINED_WEIGHTS]: bytes.buffer }
}

/**
 * El .n4l de un modelo entrenado con el conjunto de un paquete. `rename`: su nombre en cada idioma de los textos del
 * paquete (a partir del nombre de la tarea), para distinguirlo del original en el menú
 */
export async function trainedModelPackage(
  base: N4LPackage_t,
  task: string,
  trained: TrainedModel_t,
  rename: (language: string, name: string) => string,
): Promise<{ manifest: N4LManifest_t, files: Record<string, string | ArrayBuffer> }> {
  const section = base.manifest.tasks.find((item) => item.task === task)
  if (section === undefined) throw new Error(`n4l: ${base.manifest.id} no tiene la tarea ${task}`)
  // Los ficheros del paquete, sin los modelos que traía en esta tarea (el entrenado los sustituye)
  const replaced = new Set(n4lLayersModels(section).map(({ path }) => path.slice(0, path.lastIndexOf('/') + 1)))
  const files = (await n4lPackageFiles(base)).filter((file) => file !== N4L_MANIFEST && ![...replaced].some((dir) => file.startsWith(dir)))
  const contents: Record<string, string | ArrayBuffer> = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await base.source.readBytes(file)] as const)))

  // Las clases, en el orden de las salidas del modelo entrenado (con los otros nombres que tuvieran)
  const classes: N4LClass_t[] = trained.classes.map((id) => section.classes?.find((item) => item.id === id) ?? { id })
  const manifest: N4LManifest_t = {
    ...base.manifest,
    id     : `${base.manifest.id}-model-${trained.number}`,
    version: '1.0.0',
    tasks  : base.manifest.tasks.map((item) => (item.task !== task ? item : {
      ...item,
      key   : `${item.key}-${trained.number}`,
      classes,
      models: [{
        id     : 'trained',
        format : 'tfjs-layers',
        path   : TRAINED_PATH,
        dataset: item.datasets[0],
        ...(trained.input !== undefined && { input: trained.input }),
        metrics: trained.metrics,
      }],
      training: { layers: trained.layers },
      // Los ejemplos tienen que ser de alguna de sus clases
      ...keepExamples(item.prediction, classes),
    })),
  }
  // Su nombre en cada idioma
  for (const language of base.manifest.locales) {
    const file = `locales/${language}.json`
    const texts = JSON.parse(new TextDecoder().decode(contents[file] as ArrayBuffer))
    const own = texts.tasks?.[task]
    if (own !== undefined) {
      for (const key of ['name', 'title'] as const) if (typeof own[key] === 'string') own[key] = rename(language, own[key])
    }
    contents[file] = JSON.stringify(texts, null, 2)
  }
  return { manifest, files: { ...contents, ...await modelFiles(trained.model), [N4L_MANIFEST]: JSON.stringify(manifest, null, 2) } }
}

/** El .n4l del modelo entrenado, como Blob (para descargarlo) o sus bytes */
export async function packTrainedModel(...args: Parameters<typeof trainedModelPackage>) {
  const { manifest, files } = await trainedModelPackage(...args)
  return { manifest, blob: await packN4L(files) }
}
