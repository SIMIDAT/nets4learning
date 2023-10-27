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
 * @property {string} X_feature
 * @property {string} y_target
 * @property {Map<string, number>} categorical
 */

/**
 * @typedef  LRConfigParams_t
 * @property {number} n_of_epochs
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
 * @property {string} [id_optimizer="train-adam"]
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
 * @typedef LRConfigVisor_t
 * @property {boolean} scatterplot
 * @property {boolean} linechart
 * @property {boolean} confusion_matrix
 */

/**
 * @typedef  LRConfig_t
 * @property {LRConfigFit_t} fit
 * @property {LRConfigCompile_t} compile
 * @property {LRConfigFeatures_t} features
 * @property {LRConfigLayers_t} layers
 * @property {LRConfigVisor_t} visor
 */

/**
 * @typedef  CustomLRModel_t
 * @property {Uint8Array | Int32Array | Float32Array} original
 * @property {Uint8Array | Int32Array | Float32Array} predicted
 * @property {Sequential} model
 */

export default class RegressionModelController_Simple {

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
        X_feature  : '',
        y_target   : '',
        categorical: new Map()
      },
      compile : {
        id_optimizer: 'train-adam',
        id_loss     : 'losses-meanSquaredError',
        id_metrics  : ['metrics-meanSquaredError', 'metrics-meanAbsoluteError'],
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
      visor   : {
        scatterplot     : true,
        linechart       : true,
        confusion_matrix: false,
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
    this.config.features.X_feature = features.X_feature
    this.config.features.y_target = features.y_target
    this.config.features.categorical = new Map()// features.categorical
  }

  /**
   *
   * @param {LRConfigFit_t} configFit
   **/
  setFit (configFit) {
    this.config.fit.epochs = configFit.epochs
    this.config.fit.metrics = configFit.metrics
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
    if (!this.dataframe.columns.includes(this.config.features.X_feature)) throw Error(`The dataset need to contain a column named ${this.config.features.X_feature}`)
    if (!this.dataframe.columns.includes(this.config.features.y_target)) throw Error(`The dataset need to contain a column named ${this.config.features.y_target}`)

    const columns = [
      this.config.features.X_feature,
      this.config.features.y_target,
    ]

    if (this.dataframe[this.config.features.X_feature].dtype === 'string') {
      const encode = new dfd.LabelEncoder()
      encode.fit(this.dataframe[this.config.features.X_feature])
      const new_serie = encode.transform(this.dataframe[this.config.features.X_feature].values)
      this.dataframe.asType(this.config.features.X_feature, 'string', { inplace: true })
      this.dataframe.addColumn(this.config.features.X_feature, new_serie, { inplace: true })
    }
    const data = Array.from(JSON.parse(JSON.stringify(dfd.toJSON(this.dataframe.loc({ columns })))))

    // Draw dataset
    if (this.config.visor.scatterplot) {
      let series_values = data.map((d) => ({
        x: d[this.config.features.X_feature],
        y: d[this.config.features.y_target],
      }))
      await tfvis.render.scatterplot(
        {
          name: this.t(`pages.playground.generator.visor.scatterplot.__feature____target__`, {
            feature: this.config.features.X_feature,
            target : this.config.features.y_target
          }),
          tab : this.t('pages.playground.generator.visor.dataset'),
        },
        {
          values: series_values
        },
        {
          xLabel: this.config.features.X_feature,
          yLabel: this.config.features.y_target,
        }
      )
    }
    if (this.config.visor.linechart) {
      const series = []
      const series_values = []
      for (const serie_name of [this.config.features.X_feature, this.config.features.y_target]) {
        series.push(serie_name)
        const serie_value = data
          .map((d) => d[serie_name])
          .map((y, x) => ({ x, y, }))
        series_values.push(serie_value)
      }
      await tfvis.render.linechart({
          name: this.t('pages.playground.generator.visor.line-chart'),
          tab : this.t('pages.playground.generator.visor.dataset'),
        },
        {
          values: series_values,
          series: series
        },
        {
          zoomToFit: false,

        }
      )
    }

    if (this.config.visor.confusion_matrix) {
      const rows = 5
      const cols = 5
      const _values = []
      for (let i = 0; i < rows; i++) {
        const row = []
        for (let j = 0; j < cols; j++) {
          row.push(/**/)
        }
        _values.push(row)
      }
      await tfvis.render.confusionMatrix({
          name: this.t('pages.playground.generator.visor.confusion-matrix'),
          tab : this.t('pages.playground.generator.visor.dataset')
        },
        { values: _values },
        {
          xLabel: this.config.features.X_feature,
          yLabel: this.config.features.y_target,
        }
      )
    }

    return data
  }

  /**
   * @private
   *
   * @return {Promise<Sequential>}
   * @constructor
   */
  async CreateModel () {
    const model = new Sequential()
    // Add a single input layer
    model.add(tfjs.layers.dense({ units: this.config.layers.input.units, activation: this.config.layers.input.activation, inputShape: this.config.layers.input.inputShape }))
    // Add layers
    for (const { units, activation } of this.config.layers.layers) {
      model.add(tfjs.layers.dense({ units, activation }))
    }
    // Add an output layer
    model.add(tfjs.layers.dense({ units: this.config.layers.output.units, activation: this.config.layers.output.activation }))

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

    // Muestra el modelo en el visor
    await tfvis.show.modelSummary({
      name: this.t('pages.playground.generator.visor.summary'),
      tab : this.t('pages.playground.generator.visor.model'),
    }, model)
    return model
  }

  /**
   *
   * @param {Object[]} data
   * @return {{inputMax: Tensor<Rank>, inputs: Tensor<Rank>, inputMin: Tensor<Rank>, labelMax: Tensor<Rank>, labelMin: Tensor<Rank>, labels: Tensor<Rank>}}
   * @constructor
   */
  ConvertToTensor (data) {
    return tfjs.tidy(() => {
      // Step 1. Shuffle the data
      tfjs.util.shuffle(data)

      // Step 2. Convert data to Tensor
      const inputs = data.map(d => d[this.config.features.X_feature])
      const labels = data.map(d => d[this.config.features.y_target])

      const inputTensor = tfjs.tensor2d(inputs, [inputs.length, 1])
      const labelTensor = tfjs.tensor2d(labels, [labels.length, 1])

      //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
      const inputMax = inputTensor.max()
      const inputMin = inputTensor.min()
      const labelMax = labelTensor.max()
      const labelMin = labelTensor.min()

      const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin))
      const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin))

      return {
        inputs: normalizedInputs,
        labels: normalizedLabels,
        inputMax,
        inputMin,
        labelMax,
        labelMin,
      }
    })
  }

  async TrainModel (model, tensorData) {
    return await model.fit(tensorData.inputs, tensorData.labels, {
      batchSize      : this.config.fit.batchSize,
      epochs         : this.config.fit.epochs,
      shuffle        : this.config.fit.shuffle,
      validationSplit: this.config.fit.testSize,
      // verbose  : 1,
      callbacks: tfvis.show.fitCallbacks(
        {
          name: this.t('pages.playground.generator.models.history-train'),
          tab : this.t('pages.playground.generator.models.train'),
        },
        ['loss', 'val_loss', 'acc', 'val_acc'],
        {
          height   : 200,
          callbacks: ['onEpochEnd', 'onBatchEnd']
        }
      )
    })
  }

  /**
   *
   * @param {Sequential} model
   * @param {Object[]} inputData
   * @param {any} normalizationData
   * @return {Promise<{original: Point_t[], predicted: Point_t[]}>}
   */
  async TestModel (model, inputData, normalizationData) {
    const { inputMax, inputMin, labelMin, labelMax } = normalizationData

    const [xs, preds] = tfjs.tidy(() => {
      const xs = tfjs.linspace(0, 1, 100)
      const preds = model.predict(xs.reshape([100, 1]))

      const unNormXs = xs.mul(inputMax.sub(inputMin)).add(inputMin)
      const unNormPreds = preds.mul(labelMax.sub(labelMin)).add(labelMin)

      return [unNormXs.dataSync(), unNormPreds.dataSync()]
    })
    const feature = this.config.features.X_feature
    const y_target = this.config.features.y_target

    /** @type Point_t[] */
    const originalPoints = inputData.map(d => ({
      x: d[this.config.features.X_feature],
      y: d[this.config.features.y_target],
    }))

    /** @type Point_t[] */
    const predictedPoints = Array.from(xs).map((value, i) => ({
      x: value,
      y: preds[i]
    }))

    await tfvis.render.scatterplot(
      {
        name: this.t('pages.playground.generator.visor.original-vs-predictions'),
        tab : this.t('pages.playground.generator.visor.predictions')
      },
      {
        values: [originalPoints, predictedPoints],
        series: [
          this.t(`pages.playground.generator.visor.scatterplot.__feature____target__`, { feature, target: y_target }),
          this.t(`pages.playground.generator.visor.predicted`),
        ]
      },
      {
        xLabel: this.config.features.X_feature,
        yLabel: this.config.features.y_target,
      }
    )

    return { original: originalPoints, predicted: predictedPoints }
  }

  async predictSingleValue (model, normalizationData, inputValue) {
    const { inputMax, inputMin, labelMin, labelMax } = normalizationData

    // Normalización del valor de entrada
    const normalizedInput = (inputValue - inputMin) / (inputMax - inputMin)
    // Desnormalización del resultado de la predicción
    return tfjs.tidy(() => {
      const xs = tfjs.tensor1d([normalizedInput])
      const preds = model.predict(xs)
      const unNormPred = preds.mul(labelMax.sub(labelMin)).add(labelMin)
      return unNormPred.dataSync()[0]
    })
  }

  /**
   *
   * @return {Promise<{original: Point_t[], model: Sequential, predicted: Point_t[]}>}
   */
  async run () {
    const data = await this.GetData()
    const model = await this.CreateModel()
    const normalizationTensorData = this.ConvertToTensor(data)
    await this.TrainModel(model, normalizationTensorData)
    const { original, predicted } = await this.TestModel(model, data, normalizationTensorData)
    const p = await this.predictSingleValue(model, normalizationTensorData, 130)
    return { model, original, predicted, p }
  }
}