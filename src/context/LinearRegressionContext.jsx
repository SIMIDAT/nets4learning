import { createContext, useState } from 'react'
import { Sequential } from '@tensorflow/tfjs'
import { DataFrame } from 'danfojs'
import { useTranslation } from 'react-i18next'
import { I_MODEL_LINEAR_REGRESSION } from '../pages/playground/1_LinearRegression/models'

/**
 * @typedef CustomPreprocessDataset_t
 * @property {string} column_name
 * @property {string} column_transform
 */

/**
 * @typedef CustomDataset_t
 * @property {boolean} is_dataset_upload
 * @property {boolean} is_dataset_processed
 * @property {string} csv
 * @property {string} info
 * @property {string} path
 * @property {DataFrame} dataframe_original
 * @property {DataFrame} dataframe_processed
 * @property {Array<CustomPreprocessDataset_t>} dataframe_transforms
 */

/**
 * @typedef CustomParamsLayerModel_t
 * @property {number} units
 * @property {string} activation
 */

/**
 * @typedef CustomParamsFeaturesSelector_t
 * @property {Set<string>} X_features
 * @property {string} X_feature
 * @property {string} y_target
 */

/**
 * @typedef CustomParamsTrainModel_t
 * @property {number} learning_rate
 * @property {number} n_of_epochs
 * @property {number} test_size
 * @property {string} id_optimizer
 * @property {string} id_loss
 * @property {Array<string>} list_id_metrics
 */

/**
 * @typedef {{x: *, y: *}} Point_t
 */

/**
 * @typedef CustomModel_t
 * @property {Sequential} model
 * @property {Point_t[]} original
 * @property {Point_t[]} predicted
 * @property {Point_t[]} predictedLinear
 */

/**
 * @typedef CustomDataset_t
 * @property {Array<CustomDataset_t>} datasets
 */

/**
 * @typedef CustomParams_t
 * @property {Array<CustomParamsLayerModel_t>} params_layers
 * @property {CustomParamsFeaturesSelector_t} params_features
 * @property {CustomParamsTrainModel_t} params_training
 * @property {Array<string>} params_visor
 */

/**
 * @typedef CustomPredict_t
 * @property {string} dataOriginal_label
 * @property {Point_t[]} dataOriginal_x
 * @property {Point_t[]} dataOriginal_y
 * @property {string} dataPredicted_label
 * @property {Point_t[]} dataPredicted_x
 * @property {Point_t[]} dataPredicted_y
 */

/**
 * @typedef CustomDatasetLocal_t
 * @property {boolean} is_dataset_upload
 * @property {boolean} is_dataset_processed
 * @property {DataFrame} dataframe_original
 * @property {DataFrame} dataframe_processed
 * @property {string} container_info
 */

/**
 * @typedef {CustomModel_t & CustomParams_t & {dataframe: DataFrame}} CustomModelGenerated_t
 */

/**
 * @typedef  CustomLinearRegressionContext_t
 *
 * @property {CustomDataset_t[]} datasets
 * @property {React.Dispatch<React.SetStateAction<CustomDataset_t[]>>} setDatasets
 *
 * @property {CustomDatasetLocal_t} datasetLocal
 * @property {React.Dispatch<React.SetStateAction<CustomDatasetLocal_t>>} setDatasetLocal
 *
 * @property {CustomParams_t} params
 * @property {React.Dispatch<React.SetStateAction<CustomParams_t>>} setParams
 *
 * @property {CustomModel_t} tmpModel
 * @property {React.Dispatch<React.SetStateAction<CustomModel_t>>} setTmpModel
 *
 * @property {Array<CustomModelGenerated_t>} listModels
 * @property {React.Dispatch<React.SetStateAction<Array<CustomModelGenerated_t>>>} setListModels
 *
 * @property {boolean} isTraining
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setIsTraining
 *
 * @property {Array<string>} accordionActive
 * @property {React.Dispatch<React.SetStateAction<Array<string>>>} setAccordionActive
 *
 * @property {I_MODEL_LINEAR_REGRESSION} iModelInstance
 * @property {React.Dispatch<React.SetStateAction<I_MODEL_LINEAR_REGRESSION>>} setIModelInstance
 *
 *
 */
const LinearRegressionContext = createContext(
  /**@type {CustomLinearRegressionContext_t}*/
  {}
)

export function LinearRegressionProvider ({ children }) {

  const { t } = useTranslation()

  // @formatter:off
  /**
   * @type CustomDatasetLocal_t
   */
  const DEFAULT_DATASET_LOCAL = {
    is_dataset_upload   : false,
    is_dataset_processed: true,
    dataframe_original  : new DataFrame(),
    dataframe_processed : new DataFrame(),
    container_info      : '',
  }

  // @formatter:off
  /** @type CustomDataset_t[] */
  const DEFAULT_CUSTOM_DATASETS = []
  /** @type CustomParams_t */
  const DEFAULT_CUSTOM_PARAMS = {
    params_training     : {
      learning_rate  : 1,  // 1%  [0-100]
      n_of_epochs    : 20,
      test_size      : 10, // 10% [0-100]
      id_optimizer   : 'train-adam',
      id_loss        : 'losses-meanSquaredError',
      list_id_metrics: ['metrics-meanSquaredError', 'metrics-meanAbsoluteError']
    },
    params_layers       : [
      { units: 10, activation: "relu" },
      { units: 20, activation: "relu" },
      { units: 20, activation: "relu" },
      { units: 20, activation: "relu" },
      { units: 20, activation: "sigmoid" },
    ],
    params_visor        : [],
    params_features     : {
      X_features: new Set(),
      X_feature : '',
      y_target  : '',
    }
  }
  /** @type CustomModel_t */
  const DEFAULT_CUSTOM_MODEL = {
    model          : new Sequential(),
    original       : [],
    predicted      : [],
    predictedLinear: []
  }
  // @formatter:on

  const [datasets, setDatasets] = useState(/** @type CustomDataset_t[] */ DEFAULT_CUSTOM_DATASETS)
  const [datasetLocal, setDatasetLocal] = useState(/** @type CustomDatasetLocal_t */ DEFAULT_DATASET_LOCAL)
  const [params, setParams] = useState(/** @type CustomParams_t */ DEFAULT_CUSTOM_PARAMS)
  const [tmpModel, setTmpModel] = useState(/** @type CustomModel_t */ DEFAULT_CUSTOM_MODEL)
  const [listModels, setListModels] = useState(/** @type Array<CustomModelGenerated_t> */[])

  const [isTraining, setIsTraining] = useState(false)
  const [accordionActive, setAccordionActive] = useState(['dataset_info'])
  const [iModelInstance, setIModelInstance] = useState(new I_MODEL_LINEAR_REGRESSION(t, setAccordionActive))

  return (
    <LinearRegressionContext.Provider value={{
      datasets,
      setDatasets,

      datasetLocal,
      setDatasetLocal,

      params,
      setParams,

      tmpModel,
      setTmpModel,

      listModels,
      setListModels,

      isTraining,
      setIsTraining,

      accordionActive,
      setAccordionActive,

      iModelInstance,
      setIModelInstance,
    }}>
      {children}
    </LinearRegressionContext.Provider>
  )
}

export default LinearRegressionContext