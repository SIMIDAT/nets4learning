import * as tfjs from '@tensorflow/tfjs'
import { Sequential } from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import * as dfd from 'danfojs'
import { DataFrame } from 'danfojs'
import LinearRegressionHelper from '@core/nn-utils/LinearRegressionHelper'

/**
 * @typedef TrainModelTensor_t
 * @property inputs: any
 * @property labels: any
 */

/**
 * @typedef  {'elu' | 'hardSigmoid' | 'linear' | 'relu' | 'relu6' | 'selu' | 'sigmoid' | 'softmax' | 'softplus' | 'softsign' | 'tanh' | 'swish' | 'mish'} ActivationIdentifier_t
 */

/**
 * @typedef  LRConfigFeatures_t
 * @property {Set<string>} X_features
 * @property {string} y_target
 * @property {Map<string, number>} categorical
 */

/**
 * @typedef  LRConfigParams_t
 * @property {number} n_of_epochs
 */

/**
 * @typedef {{x: number, y: number}[]} Point_t
 */

/**
 * @typedef ConfigLayerInput_t
 * @property {number} [units=1] - El número de unidades en la capa de entrada.
 * @property {ActivationIdentifier_t} [activation="relu"] - La función de activación para la capa.
 * @property {number[]} [inputShape=[1]] - La forma de entrada.
 */

/**
 * @typedef ConfigLayers_t
 * @property {number} [units=1] - El número de unidades en la capa.
 * @property {ActivationIdentifier_t} [activation="relu"] - La función de activación para la capa.
 */

/**
 * @typedef ConfigLayerOutput_t
 * @property {number} [units=1] - El número de unidades en la capa de salida.
 * @property {ActivationIdentifier_t} [activation="relu"] - La función de activación para la capa de salida.
 */

/**
 * @typedef LRConfigFit_t
 * @property {number} [batchSize=32]
 * @property {number} [testSize=0.1]
 * @property {number} [epochs=20]
 * @property {boolean} [shuffle=true]
 * @property {string[]} [metrics=[]]
 */

/**
 * @typedef LRConfigCompile_t
 * @property {string} [id_optimizer="train-sgd"]
 * @property {string} [id_loss="losses-meanSquaredError"]
 * @property {string[]} [id_metrics=['metrics-meanAbsoluteError']]
 * @property {{learningRate: number, momentum?: number}} [params={ learningRate: 0.0001, momentum; 1 }]
 */

/**
 * @typedef LRConfigLayers_t
 * @property {{units: number, activation: ActivationIdentifier_t, inputShape: number[]}} input
 * @property {{units: number, activation: ActivationIdentifier_t}[]} layers
 * @property {{units: number, activation: ActivationIdentifier_t}} output
 */

/**
 * @typedef  LRConfig_t
 * @property {LRConfigFit_t} fit
 * @property {LRConfigCompile_t} compile
 * @property {LRConfigFeatures_t} features
 * @property {LRConfigLayers_t} layers
 */

/**
 * @typedef  CustomLRModel_t
 * @property {Uint8Array | Int32Array | Float32Array} original
 * @property {Uint8Array | Int32Array | Float32Array} predicted
 * @property {Sequential} model
 */

export default class LinearRegressionModelController {

  /**
   * @type {LRConfig_t}
   */
  config

  /**
   *
   * @param {any} t
   */
  constructor (t) {
    this.t = t
    this.dataframe = new DataFrame()
    this.config = {
      features: {
        X_features : new Set(),
        y_target   : '',
        categorical: new Map()
      },
      compile : {
        id_optimizer: 'train-sgd',
        id_loss     : 'losses-meanSquaredError',
        id_metrics  : ['metrics-meanAbsoluteError'],
        params      : {
          learningRate: 0.0001,
          momentum    : 1,
        },
      },
      fit     : {
        batchSize     : 32,
        testSize      : 0.1,
        epochs        : 20,
        shuffle       : true,
        metrics       : ['loss', 'mse'],
        container_name: 'Training Performance',
      },
      layers  : {
        input : { units: 1, activation: 'linear', inputShape: [1] },
        layers: [
          { units: 10, activation: 'relu' },
        ],
        output: { units: 1, activation: 'linear' },
      },
    }
  }

  /**
   *
   * @param {DataFrame} dataframe
   **/
  setDataFrame (dataframe) {
    this.dataframe = new DataFrame(dfd.toJSON(dataframe))
  }

  /**
   *
   * @param {LRConfigFeatures_t} features
   **/
  setFeatures (features) {
    this.config.features.X_features = features.X_features
    this.config.features.y_target = features.y_target
    this.config.features.categorical = new Map()// features.categorical
  }

  /**
   *
   * @param {LRConfigFit_t} configFit
   **/
  setFit (configFit) {
    this.config.fit.epochs = configFit.epochs
    // this.config.fit.metrics = configFit.metrics
    this.config.fit.batchSize = configFit.batchSize
    this.config.fit.shuffle = configFit.shuffle
    this.config.fit.testSize = parseInt(configFit.testSize) / 100
  }

  /**
   *
   * @param {LRConfigCompile_t} configCompile
   */
  setCompile (configCompile) {
    this.config.compile.id_optimizer = configCompile.id_optimizer
    this.config.compile.id_loss = configCompile.id_loss
    this.config.compile.id_metrics = configCompile.id_metrics
    this.config.compile.params.learningRate = parseInt(configCompile.params.learningRate) / 100
  }

  /**
   *
   * @param configLayers
   * @param {ConfigLayerInput_t} [configLayers.input={ units: number, activation: 'linear', inputShape: number[] }]
   * @param {ConfigLayers_t[]} [configLayers.layers=[]]
   * @param {ConfigLayerOutput_t} [configLayers.output={ units: number, activation: 'linear' }]
   **/
  setLayers (configLayers) {
    const {
      input: {
        units     : inputUnits = 1,
        activation: inputActivation = 'linear',
        inputShape: inputInputShape = [1],
      } = {},
      layers = [],
      output: {
        units     : outputUnits = 1,
        activation: outputActivation = 'linear',
      } = {},
    } = configLayers

    this.config.layers = {
      input : { units: inputUnits, activation: inputActivation, inputShape: inputInputShape },
      layers: layers,
      output: { units: outputUnits, activation: outputActivation },
    }
  }

  /**
   * @private
   *
   * @return {Promise<object[]>}
   */
  async GetData () {
    if (!this.dataframe.columns.includes(this.config.features.y_target)) throw Error(`The dataset need to contain a column named ${this.config.features.y_target}`)

    const missingColumns = []
    const X_list = Array.from(this.config.features.X_features)
    for (let i = 0; i < X_list.length; i++) {
      if (!this.dataframe.columns.includes(X_list[i])) {
        missingColumns.push(X_list[i])
      }
    }
    if (missingColumns.length > 0) throw Error(`The dataset need to contain a column named ${missingColumns}`)
    const columns = [
      ...this.config.features.X_features,
      this.config.features.y_target,
    ]
    const data = Array.from(JSON.parse(JSON.stringify(dfd.toJSON(this.dataframe.loc({ columns })))))

    for (const feature of [...this.config.features.X_features]) {
      let values = data.map((d) => ({
        x: d[feature],
        y: d[this.config.features.y_target],
      }))
      await tfvis.render.scatterplot(
        {
          name: this.t(`pages.playground.generator.visor.scatterplot.__feature____target__`, { feature, target: this.config.features.y_target }),
          tab : this.t('pages.playground.generator.visor.dataset'),
        },
        { values },
        {
          xLabel: 'x',
          yLabel: 'y',
        }
      )
    }
    return data
  }

  /**
   * @private
   *
   * @param value
   * @param categoryCount
   * @returns {number[]}
   */
  OneHot (value, categoryCount) {
    return Array.from(tfjs.oneHot(value, categoryCount).dataSync())
  }

  /**
   * Rescales the range of values in the range of [0, 1]
   * @private
   *
   * @param {tfjs.Tensor2D} tensor
   * @returns {Tensor}
   */
  Normalize (tensor) {
    return tfjs.div(
      tfjs.sub(tensor,
        tfjs.min(tensor),
      ),
      tfjs.sub(
        tfjs.max(tensor),
        tfjs.min(tensor),
      ),
    )
  }

  /**
   *
   * @param {object[]} data
   * @param {Array<string>} X_features
   * @param {string} Y_TARGET
   * @param {Map<string, number>} VARIABLE_CATEGORY_COUNT
   * @param {number} testSize
   * @returns {[Tensor<Rank>, Tensor<Rank>, Tensor<Rank>, Tensor<Rank>, Tensor | Tensor[]]}
   */
  CreateDataSets (data, X_features, Y_TARGET, VARIABLE_CATEGORY_COUNT, testSize) {
    const X = data.map((r) =>
      X_features.flatMap((feature) => {
        if (VARIABLE_CATEGORY_COUNT.has(feature)) {
          return this.OneHot(!r[feature] ? 0 : r[feature], VARIABLE_CATEGORY_COUNT.get(feature))
        }
        return !r[feature] ? 0 : r[feature]
      }),
    )

    //
    const X_t = this.Normalize(tfjs.tensor2d(X))
    const y = tfjs.tensor(data.map(r => (!r[Y_TARGET] ? 0 : r[Y_TARGET])))

    const splitIdx = parseInt(((1 - testSize) * data.length).toString(), 10)
    const [xTrain, xTest] = tfjs.split(X_t, [splitIdx, data.length - splitIdx])
    const [yTrain, yTest] = tfjs.split(y, [splitIdx, data.length - splitIdx])

    return [xTrain, xTest, yTrain, yTest, X_t]
  }

  /**
   *
   * @param {Tensor<Rank>} xTrain
   * @param {Tensor<Rank>} xTest
   * @param {Tensor<Rank>} yTrain
   * @param {Tensor<Rank>} yTest
   * @returns {Promise<Sequential>}
   * @constructor
   */
  async TrainLinearModel (xTrain, xTest, yTrain, yTest) {
    // CREAR MODELO
    const model = new Sequential()
    // Input
    model.add(
      tfjs.layers.dense({
        inputShape: [xTrain.shape[1]],
        units     : xTrain.shape[1],
        activation: this.config.layers.input.activation,
      }),
    )
    // Layers
    for (const { units, activation } of this.config.layers.layers) {
      model.add(tfjs.layers.dense({ units, activation }))
    }
    // Output
    model.add(tfjs.layers.dense({
      units     : this.config.layers.output.units,
      activation: this.config.layers.output.activation
    }))

    await tfvis.show.modelSummary({
      name: this.t('pages.playground.generator.visor.summary'),
      tab : this.t('pages.playground.generator.visor.model'),
    }, model)

    // COMPILA EL MODELO DEFINIDO ANTERIORMENTE
    const idOptimizer = this.config.compile.id_optimizer
    const params = this.config.compile.params
    const idLoss = this.config.compile.id_loss
    const idMetrics = this.config.compile.id_metrics

    const _optimizer = LinearRegressionHelper.CREATE_OPTIMIZER(idOptimizer, params)
    const _loss = LinearRegressionHelper.CREATE_LOSS(idLoss)
    const _metrics = LinearRegressionHelper.CREATE_METRICS(idMetrics)

    model.compile({
      optimizer: _optimizer,
      loss     : _loss,
      metrics  : _metrics,
    })

    // ENTRENAR MODELO
    const fit_callbacks_metrics_labels = ['loss', 'val_loss', 'acc', 'val_acc']
    const fit_callbacks_container = {
      name  : this.t('pages.playground.generator.visor.history-train'),
      tab   : this.t('pages.playground.generator.visor.train'),
      styles: { height: '1000px' },
    }
    const fit_callback = tfvis.show.fitCallbacks(fit_callbacks_container, fit_callbacks_metrics_labels, {
      callbacks: [
        'onEpochEnd',
        'onBatchEnd',
      ],
    })
    await model.fit(xTrain, yTrain, {
      batchSize      : this.config.fit.batchSize,
      epochs         : this.config.fit.epochs,
      shuffle        : this.config.fit.shuffle,
      validationSplit: this.config.fit.testSize,
      validationData : [xTest, yTest],
      verbose        : true,
      validationSteps: 10,
      callbacks      : fit_callback
    })

    return model
  }

  /**
   *
   * TODO
   * El método no está probado completamente y puede fallar.
   *
   * @return {Promise<CustomLRModel_t>}
   */
  async run () {
    const data = await this.GetData()

    const X_FEATURES = Array.from(this.config.features.X_features)
    const Y_TARGET = this.config.features.y_target
    const VARIABLE_CATEGORY_COUNT = this.config.features.categorical

    // params
    const testSize = this.config.fit.testSize

    const [xTrain, xTest, yTrain, yTest] = this.CreateDataSets(data, X_FEATURES, Y_TARGET, VARIABLE_CATEGORY_COUNT, testSize)
    const model = await this.TrainLinearModel(xTrain, xTest, yTrain, yTest)

    const original = yTest.dataSync()
    const predicted = model.predict(xTest).dataSync()

    return { original, predicted, model }
  }

}