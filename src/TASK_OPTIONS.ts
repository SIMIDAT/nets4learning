import { TASKS, UPLOAD } from '@/TASKS'
import { CL_MODEL_KEYS, IC_MODEL_KEYS, LR_MODEL_KEYS, OD_MODEL_KEYS, TC_MODEL_KEYS } from '@/MODEL_KEYS'

// Modelos preentrenados y datasets de cada tarea (clave y etiqueta). Separado de DATA_MODEL, que importa los
// registros de modelos, para que la home o las migas de pan puedan usar estas listas sin cargarlos.

const TASK_MODEL_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-1', value: TC_MODEL_KEYS.CAR },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-2', value: TC_MODEL_KEYS.IRIS },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-3', value: TC_MODEL_KEYS.LYMPHOGRAPHY },
  ],
  [TASKS.REGRESSION]: [
    // { i18n: 'datasets-models.1-regression.list-models.salary', value: LR_MODEL_KEYS.SALARY },
    { i18n: 'datasets-models.1-regression.list-models.auto-mpg', value: LR_MODEL_KEYS.AUTO_MPG },
    // { i18n: 'datasets-models.1-regression.list-models.housing-prices', value: LR_MODEL_KEYS.HOUSING_PRICES },
    // { i18n: 'datasets-models.1-regression.list-models.breast-cancer', value: LR_MODEL_KEYS.BREAST_CANCER },
    { i18n: 'datasets-models.1-regression.list-models.student-performance', value: LR_MODEL_KEYS.STUDENT_PERFORMANCE },
    { i18n: 'datasets-models.1-regression.list-models.wine', value: LR_MODEL_KEYS.WINE },
  ],
  [TASKS.OBJECT_DETECTION]: [
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-1', value: OD_MODEL_KEYS.FACE_DETECTOR },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-2', value: OD_MODEL_KEYS.FACE_MESH },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-3', value: OD_MODEL_KEYS.MOVE_NET_POSE_NET },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-4', value: OD_MODEL_KEYS.COCO_SSD },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-5', value: OD_MODEL_KEYS.FACE_API },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-6', value: OD_MODEL_KEYS.HAND_SIGN },
  ],
  [TASKS.IMAGE_CLASSIFICATION]: [
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-1', value: IC_MODEL_KEYS.MNIST },
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-4', value: IC_MODEL_KEYS.KMNIST },
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-2', value: IC_MODEL_KEYS.MOBILENET },
  ],
  // Agrupar no necesita un modelo entrenado antes: se hace al momento con los datos
  [TASKS.CLUSTERING]: [],
}
export type TASK_MODEL_OPTIONS_TYPE = typeof TASK_MODEL_OPTIONS
export type MODEL_OPTIONS_TYPE = TASK_MODEL_OPTIONS_TYPE[keyof TASK_MODEL_OPTIONS_TYPE]

const TASK_DATASET_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'pages.menu-selection-dataset.0-tabular-classification.csv', value: UPLOAD },
    {
      i18n : 'datasets-models.0-tabular-classification.list-datasets.0-option-1',
      value: TC_MODEL_KEYS.CAR,
      info : { source: 'https://archive.ics.uci.edu/dataset/19/car+evaluation', files: ['models/00-tabular-classification/car/car.csv'], rows: [1728], features: 6, classes: 4 },
    },
    {
      i18n : 'datasets-models.0-tabular-classification.list-datasets.0-option-2',
      value: TC_MODEL_KEYS.IRIS,
      info : { source: 'https://archive.ics.uci.edu/dataset/53/iris', files: ['models/00-tabular-classification/iris/iris.csv'], rows: [150], features: 4, classes: 3 },
    },
    {
      i18n : 'datasets-models.0-tabular-classification.list-datasets.0-option-3',
      value: TC_MODEL_KEYS.LYMPHOGRAPHY,
      info : { source: 'https://archive.ics.uci.edu/dataset/63/lymphography', files: ['models/00-tabular-classification/lymphography/lymphography.csv'], rows: [148], features: 18, classes: 4 },
    },
  ],
  [TASKS.REGRESSION]: [
    // TODO
    { i18n: 'pages.menu-selection-dataset.1-regression.csv', value: UPLOAD },
    {
      i18n : 'datasets-models.1-regression.list-datasets.salary',
      value: LR_MODEL_KEYS.SALARY,
      info : { source: 'https://www.kaggle.com/datasets/saquib7hussain/experience-salary-dataset', files: ['datasets/01-regression/salary/salary.csv', 'datasets/01-regression/salary/salary-extra.csv'], rows: [1000, 373], target: 'Salary' },
    },
    {
      i18n : 'datasets-models.1-regression.list-datasets.auto-mpg',
      value: LR_MODEL_KEYS.AUTO_MPG,
      info : { source: 'https://archive.ics.uci.edu/dataset/9/auto+mpg', files: ['datasets/01-regression/auto-mpg/auto-mpg.csv'], rows: [396], features: 6, target: 'mpg' },
    },
    {
      i18n : 'datasets-models.1-regression.list-datasets.housing-prices',
      value: LR_MODEL_KEYS.HOUSING_PRICES,
      info : { source: 'https://www.cs.toronto.edu/~delve/data/boston/bostonDetail.html', files: ['datasets/01-regression/housing-prices/boston-housing-2020.csv'], rows: [506], features: 12, target: 'MEDV' },
    },
    // { i18n: 'datasets-models.1-regression.list-datasets.breast-cancer', value: LR_MODEL_KEYS.BREAST_CANCER },
    {
      i18n : 'datasets-models.1-regression.list-datasets.student-performance',
      value: LR_MODEL_KEYS.STUDENT_PERFORMANCE,
      info : { source: 'https://archive.ics.uci.edu/dataset/320/student+performance', files: ['datasets/01-regression/student-performance/student-mat-2024.csv', 'datasets/01-regression/student-performance/student-por-2024.csv'], rows: [395, 649], features: 30, target: 'G3' },
    },
    {
      i18n : 'datasets-models.1-regression.list-datasets.wine',
      value: LR_MODEL_KEYS.WINE,
      info : { source: 'https://archive.ics.uci.edu/dataset/186/wine+quality', files: ['datasets/01-regression/wine-quality/wine-quality-red.csv', 'datasets/01-regression/wine-quality/wine-quality-white.csv'], rows: [1599, 4898], features: 11, target: 'quality' },
    },
  ],
  [TASKS.OBJECT_DETECTION]    : [],
  [TASKS.IMAGE_CLASSIFICATION]: [
    {
      i18n : 'datasets-models.3-image-classification.list-datasets.mnist',
      value: IC_MODEL_KEYS.MNIST,
      info : { source: 'https://yann.lecun.com/exdb/mnist/', rows: [65000], classes: 10, images: true },
    },
    {
      i18n : 'datasets-models.3-image-classification.list-datasets.kmnist',
      value: IC_MODEL_KEYS.KMNIST,
      info : { source: 'https://github.com/rois-codh/kmnist', rows: [25000], classes: 10, images: true },
    },
  ],
  // Conjuntos con clases conocidas: se agrupan sin verlas y al final se comparan los grupos con ellas
  [TASKS.CLUSTERING]: [
    { i18n: 'pages.menu-selection-dataset.clustering.csv', value: UPLOAD },
    {
      i18n : 'datasets-models.clustering.list-datasets.iris',
      value: CL_MODEL_KEYS.IRIS,
      info : { source: 'https://archive.ics.uci.edu/dataset/53/iris', files: ['models/00-tabular-classification/iris/iris.csv'], rows: [150], features: 4, classes: 3 },
    },
    {
      i18n : 'datasets-models.clustering.list-datasets.wine',
      value: CL_MODEL_KEYS.WINE,
      info : { source: 'https://archive.ics.uci.edu/dataset/109/wine', files: ['datasets/wine.csv'], rows: [178], features: 13, classes: 3 },
    },
    {
      i18n : 'datasets-models.clustering.list-datasets.new-thyroid',
      value: CL_MODEL_KEYS.NEW_THYROID,
      info : { source: 'https://archive.ics.uci.edu/dataset/102/thyroid+disease', files: ['datasets/new-thyroid.csv'], rows: [215], features: 5, classes: 3 },
    },
  ],
}
export type TASK_DATASET_OPTIONS_TYPE = typeof TASK_DATASET_OPTIONS
export type DATASET_OPTIONS_TYPE = TASK_DATASET_OPTIONS_TYPE[keyof TASK_DATASET_OPTIONS_TYPE]

/** Lo que se cuenta de un dataset en su tarjeta (los números salen de sus CSV; un test lo comprueba) */
export type DatasetInfo_t = {
  /** CSV del dataset, relativos a public/ (los mismos que carga la clase del modelo) */
  files?   : string[]
  /** Filas de cada CSV, o imágenes del dataset */
  rows     : number[]
  /** Columnas de entrada (sin la variable objetivo); solo si todos los CSV tienen las mismas */
  features?: number
  /** Clasificación: número de clases */
  classes? : number
  /** Regresión: variable que se predice */
  target?  : string
  /** Imágenes de 28×28 en lugar de filas de un CSV */
  images?  : boolean
  /** Página original del dataset (UCI, Kaggle…) */
  source?  : string
}

export type TaskOption_t = { i18n: string, value: string, info?: DatasetInfo_t }
export type TaskKind_t = 'model' | 'dataset'

/** Modelos preentrenados (`model`) o datasets con los que entrenar (`dataset`) de una tarea */
export function taskOptions(task: string, kind: TaskKind_t): TaskOption_t[] {
  const options: Record<string, TaskOption_t[]> = kind === 'model' ? TASK_MODEL_OPTIONS : TASK_DATASET_OPTIONS
  return options[task] ?? []
}

export {
  TASK_MODEL_OPTIONS,
  TASK_DATASET_OPTIONS,
}
