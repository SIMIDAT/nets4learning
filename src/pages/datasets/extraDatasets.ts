import { TASKS, type TASKS_TYPE_V } from '@/TASKS'

/** Conjunto de datos que no usa ningún modelo: sirve para practicar (con «Entrenar» se carga en la página de subir datos) */
export type ExtraDataset_t = {
  /** Fichero de public/ */
  file    : string
  source  : string
  samples : number
  /** Clasificación: clases de la columna objetivo (las columnas de entrada y la objetivo, en datasetVariables) */
  classes?: number
  i18n    : string
  /** Su frase en /datasets, si no es la de `datasets.summary.extra.<clave>` (el mismo fichero en otra tarea) */
  summary?: string
}

// @formatter:off
export const EXTRA_DATASETS: Partial<Record<TASKS_TYPE_V, ExtraDataset_t[]>> = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { file: 'datasets/hepatitis-c.csv', source: 'https://archive.ics.uci.edu/ml/datasets/HCV+data', samples: 589, classes: 5, i18n: 'datasets.download-dataset-hepatitis-c' },
    { file: 'datasets/ecoli.csv', source: 'https://github.com/jbrownlee/Datasets/blob/master/ecoli.names', samples: 336, classes: 8, i18n: 'datasets.download-dataset-ecoli' },
    { file: 'n4l/new-thyroid.n4l/data/new-thyroid.csv', source: 'https://github.com/jbrownlee/Datasets/blob/master/new-thyroid.names', samples: 215, classes: 3, i18n: 'datasets.download-dataset-new-thyroid' },
    { file: 'n4l/wine.n4l/data/wine.csv', source: 'https://github.com/jbrownlee/Datasets/blob/master/wine.names', samples: 178, classes: 3, i18n: 'datasets.download-dataset-wine' },
    { file: 'datasets/titanic.csv', source: 'https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/problem12.html', samples: 887, classes: 2, i18n: 'datasets.download-dataset-titanic' },
  ],
  [TASKS.REGRESSION]: [
    { file: 'n4l/breast-cancer.n4l/data/breast-cancer-wisconsin.csv', source: 'https://archive.ics.uci.edu/dataset/15/breast+cancer+wisconsin+original', samples: 699, i18n: 'datasets.download.dataset.1-regression.breast-cancer-original' },
    { file: 'n4l/breast-cancer.n4l/data/wpbc.csv', source: 'https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic', samples: 198, i18n: 'datasets.download.dataset.1-regression.breast-cancer-wpbc' },
    { file: 'n4l/breast-cancer.n4l/data/wdbc.csv', source: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic', samples: 569, i18n: 'datasets.download.dataset.1-regression.breast-cancer-wdbc' },
  ],
  // Agrupamiento: las clases solo se usan para comparar. Del que más se parece a sus clases al que menos (la hepatitis,
  // a propósito: los grupos no tienen por qué ser las clases)
  [TASKS.CLUSTERING]: [
    { file: 'n4l/breast-cancer.n4l/data/breast-cancer-wisconsin.csv', source: 'https://archive.ics.uci.edu/dataset/15/breast+cancer+wisconsin+original', samples: 699, classes: 2, i18n: 'datasets.download.dataset.1-regression.breast-cancer-original', summary: 'datasets.summary.clustering.breast-cancer-wisconsin' },
    { file: 'n4l/breast-cancer.n4l/data/wdbc.csv', source: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic', samples: 569, classes: 2, i18n: 'datasets.download.dataset.1-regression.breast-cancer-wdbc', summary: 'datasets.summary.clustering.wdbc' },
    { file: 'datasets/ecoli.csv', source: 'https://github.com/jbrownlee/Datasets/blob/master/ecoli.names', samples: 336, classes: 8, i18n: 'datasets.download-dataset-ecoli', summary: 'datasets.summary.clustering.ecoli' },
    { file: 'datasets/hepatitis-c.csv', source: 'https://archive.ics.uci.edu/ml/datasets/HCV+data', samples: 589, classes: 5, i18n: 'datasets.download-dataset-hepatitis-c', summary: 'datasets.summary.clustering.hepatitis-c' },
  ],
}
// @formatter:on
