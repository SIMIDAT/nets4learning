import { TASKS, type TASKS_TYPE_V } from "@/TASKS"

/** Conjunto de datos que no usa ningún modelo: sirve para practicar subiendo un CSV propio */
export type ExtraDataset_t = {
  /** Fichero de public/ */
  file   : string
  source : string
  samples: number
  i18n   : string
}

// @formatter:off
export const EXTRA_DATASETS: Partial<Record<TASKS_TYPE_V, ExtraDataset_t[]>> = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { file: "datasets/hepatitis-c.csv", source: "https://archive.ics.uci.edu/ml/datasets/HCV+data", samples: 589, i18n: "datasets.download-dataset-hepatitis-c" },
    { file: "datasets/ecoli.csv", source: "https://github.com/jbrownlee/Datasets/blob/master/ecoli.names", samples: 336, i18n: "datasets.download-dataset-ecoli" },
    { file: "datasets/new-thyroid.csv", source: "https://github.com/jbrownlee/Datasets/blob/master/new-thyroid.names", samples: 215, i18n: "datasets.download-dataset-new-thyroid" },
    { file: "datasets/wine.csv", source: "https://github.com/jbrownlee/Datasets/blob/master/wine.names", samples: 178, i18n: "datasets.download-dataset-wine" },
    { file: "datasets/titanic.csv", source: "https://web.stanford.edu/class/archive/cs/cs109/cs109.1166/problem12.html", samples: 887, i18n: "datasets.download-dataset-titanic" },
  ],
  [TASKS.REGRESSION]: [
    { file: "datasets/01-regression/breast-cancer/breast-cancer-wisconsin.csv", source: "https://archive.ics.uci.edu/dataset/15/breast+cancer+wisconsin+original", samples: 699, i18n: "datasets.download.dataset.1-regression.breast-cancer-original" },
    { file: "datasets/01-regression/breast-cancer/wpbc.csv", source: "https://archive.ics.uci.edu/dataset/16/breast+cancer+wisconsin+prognostic", samples: 198, i18n: "datasets.download.dataset.1-regression.breast-cancer-wpbc" },
    { file: "datasets/01-regression/breast-cancer/wdbc.csv", source: "https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic", samples: 569, i18n: "datasets.download.dataset.1-regression.breast-cancer-wdbc" },
  ],
}
// @formatter:on
