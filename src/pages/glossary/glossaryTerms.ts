import IMGLinear from './assets/Linear.png'
import IMGLeakyReLU from './assets/LeakyReLU.png'
import IMGHardSigmoid from './assets/Hardsigmoid.png'
import IMGReLU from './assets/ReLU.png'
import IMGReLU6 from './assets/ReLU6.png'
import IMGSELU from './assets/SELU.png'
import IMGELU from './assets/ELU.png'
import IMGSigmoid from './assets/Sigmoid.png'
import IMGTanh from './assets/Tanh.png'
import IMGMish from './assets/Mish.png'
import IMGSoftPlus from './assets/Softplus.png'
import type { TFunction } from 'i18next'
import { TYPE_LOSSES_CLASSIFICATION, TYPE_LOSSES_REGRESSION } from '@core/nn-utils/ArchitectureTypesHelper'
import { ACTIVATION_FUNCTIONS } from './activationFunctions'

// Contenido del glosario como datos: cada término reúne su descripción, sus características, sus fórmulas y su gráfica
// (antes estaban en tablas y acordeones separados). Los textos son claves de i18n; los nombres propios (Adam, ReLU…) y
// las fórmulas (LaTeX) no se traducen.

/** Fórmula en LaTeX ($$ … $$) o nota con matemáticas en línea ($ … $), en el orden en que se leen */
export type GlossaryMath_t = string | { noteKey: string }

export type GlossaryLink_t = { href: string, label: string }

export type GlossaryTerm_t = {
  /** Ancla del término: #glossary-<id> */
  id                 : string
  /** Título: clave de i18n o, si es un nombre propio, el texto (`title`) */
  titleKey?          : string
  title?             : string
  /** Párrafos (claves de i18n; admiten <i>, <br />…) */
  paragraphKeys      : string[]
  /** Clave de un objeto de i18n cuyos valores son las características */
  characteristicsKey?: string
  math?              : GlossaryMath_t[]
  image?             : string
  /** Activación que se puede dibujar animada (clave de ACTIVATION_FUNCTIONS): la gráfica va en pestañas */
  activation?        : string
  reference?         : GlossaryLink_t
  /** Leyenda de TP, TN, FP y FN (métricas de la matriz de confusión) */
  confusionLegend?   : boolean
}

export type GlossaryGroup_t = {
  /** Ancla del grupo (los enlaces de ayuda del playground llevan a algunos): #glossary-<id> */
  id?      : string
  titleKey?: string
  terms    : GlossaryTerm_t[]
}

export type GlossarySection_t = {
  /** Clave de i18n del separador: también es el paso del índice de la página */
  step       : string
  introKeys  : string[]
  groups     : GlossaryGroup_t[]
  references?: GlossaryLink_t[]
}

const range = (prefix: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`)

const LOSS_FORMULAS = {
  binaryCrossentropy     : '$$ -\\left(y\\log(p) + (1 - y)\\log(1 - p)\\right) $$',
  categoricalCrossentropy: '$$ -\\sum_{c=1}^{M} y_{o,c}\\log(p_{o,c}) $$',
  mse                    : '$$ MSE = \\frac{1}{m}\\sum^{m}_{i=1}(y^{(i)} - \\hat{y}^{(i)})^2 $$',
  mae                    : '$$ MAE = \\frac{1}{m}\\sum^{m}_{i=1}\\left|y^{(i)} - \\hat{y}^{(i)}\\right| $$',
  mape                   : '$$ MAPE = \\frac{100}{m}\\sum^{m}_{i=1}\\left|\\frac{y^{(i)} - \\hat{y}^{(i)}}{y^{(i)}}\\right| $$',
  // En dos líneas: en una no cabe en la tarjeta
  cosine                 : [
    '$$ S_{C}(A,B) = \\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\|\\|\\mathbf{B}\\|} $$',
    '$$ \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\|\\|\\mathbf{B}\\|} = \\frac{\\sum_{i=1}^{n} A_{i}B_{i}}{\\sqrt{\\sum_{i=1}^{n} A_{i}^{2}}\\sqrt{\\sum_{i=1}^{n} B_{i}^{2}}} $$',
  ],
}

const CROSS_ENTROPY = 'equations.loss-functions.cross-entropy.'

// Fórmulas de cada pérdida que se puede elegir en el editor de hiperparámetros
const LOSS_MATH: Partial<Record<string, GlossaryMath_t[]>> = {
  categoricalCrossentropy  : [{ noteKey: CROSS_ENTROPY + 'text-2' }, LOSS_FORMULAS.categoricalCrossentropy, { noteKey: CROSS_ENTROPY + 'text-3' }],
  binaryCrossentropy       : [{ noteKey: CROSS_ENTROPY + 'text-1' }, LOSS_FORMULAS.binaryCrossentropy],
  kullbackLeiblerDivergence: [
    '$$ KL(\\hat{y} \\| y) = \\sum_{c=1}^{M}\\hat{y}_c \\log{\\frac{\\hat{y}_c}{y_c}} $$',
    '$$ JS(\\hat{y} \\| y) = \\frac{1}{2}\\left(KL(y \\| \\tfrac{y+\\hat{y}}{2}) + KL(\\hat{y} \\| \\tfrac{y+\\hat{y}}{2})\\right) $$',
  ],
  hinge                      : ['$$ \\max(0,\\ 1 - t \\cdot y) $$'],
  squaredHinge               : ['$$ \\max(0,\\ 1 - t \\cdot y)^2 $$'],
  categoricalHinge           : ['$$ \\max\\left(0,\\ 1 + \\max_{j \\neq c} \\hat{y}_j - \\hat{y}_c\\right) $$'],
  meanSquaredError           : [LOSS_FORMULAS.mse],
  meanAbsoluteError          : [LOSS_FORMULAS.mae],
  meanAbsolutePercentageError: [LOSS_FORMULAS.mape],
  meanSquaredLogarithmicError: ['$$ MSLE = \\frac{1}{m}\\sum^{m}_{i=1}\\left(\\log(1 + y^{(i)}) - \\log(1 + \\hat{y}^{(i)})\\right)^2 $$'],
  logcosh                    : ['$$ \\frac{1}{m}\\sum^{m}_{i=1}\\log\\left(\\cosh(\\hat{y}^{(i)} - y^{(i)})\\right) $$'],
  poisson                    : ['$$ \\frac{1}{m}\\sum^{m}_{i=1}\\left(\\hat{y}^{(i)} - y^{(i)}\\log(\\hat{y}^{(i)})\\right) $$'],
  cosineProximity            : LOSS_FORMULAS.cosine,
}

const lossTerm = ({ key, label }: { key: string, label: string }): GlossaryTerm_t => ({
  id           : 'loss-' + key,
  title        : label,
  paragraphKeys: [`pages.glossary.loss-functions.table.${key}.description`],
  math         : LOSS_MATH[key],
})

const ACTIVATION = 'pages.glossary.activation-functions.table.'
const PYTORCH = (name: string) => ({ href: `https://pytorch.org/docs/stable/generated/torch.nn.${name}.html`, label: `PyTorch · nn.${name}` })

const activationTerm = (key: string, math: string, image: string | undefined, pytorch: string): GlossaryTerm_t => ({
  id                : 'activation-' + key,
  titleKey          : ACTIVATION + key + '.title',
  paragraphKeys     : [ACTIVATION + key + '.description'],
  characteristicsKey: ACTIVATION + key + '.characteristics',
  math              : [math],
  image,
  activation        : key in ACTIVATION_FUNCTIONS ? key : undefined,
  reference         : PYTORCH(pytorch),
})

const OPTIMIZER = 'pages.glossary.optimization-functions.table.'

const optimizerTerm = (key: string, title: string, math?: string): GlossaryTerm_t => ({
  id           : 'optimizer-' + key,
  title,
  paragraphKeys: [OPTIMIZER + key + '.description'],
  math         : math === undefined ? undefined : [math],
})

const METRIC = 'pages.glossary.metric-functions.table.'
const ACCURACY = '$$ Accuracy = \\frac{TP+TN}{TP+TN+FP+FN} $$'

const metricTerm = (key: string, math?: GlossaryMath_t[], confusionLegend = false): GlossaryTerm_t => ({
  id           : 'metric-' + key,
  title        : key,
  paragraphKeys: [METRIC + key + '.description'],
  math,
  confusionLegend,
})

const editorTerm = (table: string, key: string): GlossaryTerm_t => ({
  id           : 'editor-' + key,
  titleKey     : `pages.glossary.${table}.table.${key}.title`,
  paragraphKeys: [`pages.glossary.${table}.table.${key}.description`],
})

export const GLOSSARY_SECTIONS: GlossarySection_t[] = [
  {
    step     : 'hr.tasks',
    introKeys: [],
    groups   : [{
      terms: [
        { id: 'task-tabular-classification', titleKey: 'pages.glossary.tabular-classification.title', paragraphKeys: range('pages.glossary.tabular-classification.text-', 1, 4) },
        { id: 'task-regression', titleKey: 'pages.glossary.regression.title', paragraphKeys: range('pages.glossary.regression.text.', 0, 3) },
        { id: 'task-image-classification', titleKey: 'pages.glossary.image-classification.title', paragraphKeys: range('pages.glossary.image-classification.text-', 1, 5) },
        { id: 'task-object-identification', titleKey: 'pages.glossary.object-identification.title', paragraphKeys: range('pages.glossary.object-identification.text-', 1, 4) },
      ],
    }],
  },
  {
    step     : 'hr.editor',
    introKeys: [],
    groups   : [
      {
        id      : 'editor-layers',
        titleKey: 'pages.glossary.editor-layers.title',
        terms   : ['units', 'activation-function'].map((key) => editorTerm('editor-layers', key)),
      },
      {
        id      : 'editor-hyperparameters',
        titleKey: 'pages.glossary.editor-hyperparameters.title',
        terms   : ['learning-rate', 'number-or-epochs', 'test-size', 'optimizer', 'loss-function', 'metric-function'].map((key) => editorTerm('editor-hyperparameters', key)),
      },
    ],
  },
  {
    step     : 'hr.optimization-function',
    introKeys: ['pages.glossary.optimization-functions.text-1', 'pages.glossary.optimization-functions.text-2'],
    groups   : [{
      terms: [
        optimizerTerm('sgd', 'SGD', '$$ W = W - \\alpha \\frac{\\partial \\mathcal{J}}{\\partial W} $$'),
        optimizerTerm('momentum', 'Momentum', '$$ \\begin{split} v_{dW} &= \\beta v_{dW} + (1 - \\beta) \\frac{\\partial \\mathcal{J}}{\\partial W} \\\\ W &= W - \\alpha v_{dW} \\end{split} $$'),
        optimizerTerm('adagrad', 'AdaGrad', '$$ \\begin{split} g_{t}^{i} &= \\frac{\\partial \\mathcal{J}(w_{t}^{i})}{\\partial W} \\\\ W &= W - \\alpha \\frac{\\partial \\mathcal{J}(w_{t}^{i})}{\\sqrt{\\sum_{r=1}^{t}\\left(g_{r}^{i}\\right)^{2} + \\varepsilon}} \\end{split} $$'),
        optimizerTerm('adadelta', 'Adadelta', '$$ \\begin{split} v_t &= \\rho v_{t-1} + (1-\\rho) \\nabla_\\theta^2 J(\\theta) \\\\ \\Delta\\theta &= \\dfrac{\\sqrt{w_t + \\epsilon}}{\\sqrt{v_t + \\epsilon}} \\nabla_\\theta J(\\theta) \\\\ \\theta &= \\theta - \\eta \\Delta\\theta \\\\ w_t &= \\rho w_{t-1} + (1-\\rho) \\Delta\\theta^2 \\end{split} $$'),
        optimizerTerm('rmsprop', 'RMSProp', '$$ \\begin{split} s_{dW} &= \\beta s_{dW} + (1 - \\beta) \\left(\\frac{\\partial \\mathcal{J}}{\\partial W}\\right)^2 \\\\ W &= W - \\alpha \\frac{\\frac{\\partial \\mathcal{J}}{\\partial W}}{\\sqrt{s_{dW}} + \\varepsilon} \\end{split} $$'),
        optimizerTerm('adam', 'Adam', '$$ \\begin{split} v_{dW} &= \\beta_1 v_{dW} + (1 - \\beta_1) \\frac{\\partial \\mathcal{J}}{\\partial W} \\\\ s_{dW} &= \\beta_2 s_{dW} + (1 - \\beta_2) \\left(\\frac{\\partial \\mathcal{J}}{\\partial W}\\right)^2 \\\\ v^{corrected}_{dW} &= \\frac{v_{dW}}{1 - (\\beta_1)^t} \\\\ s^{corrected}_{dW} &= \\frac{s_{dW}}{1 - (\\beta_2)^t} \\\\ W &= W - \\alpha \\frac{v^{corrected}_{dW}}{\\sqrt{s^{corrected}_{dW}} + \\varepsilon} \\end{split} $$'),
        optimizerTerm('adamax', 'Adamax'),
      ],
    }],
    references: [{ href: 'https://js.tensorflow.org/api/latest/#Training-Optimizers', label: 'TensorFlow.js · Training / Optimizers' }],
  },
  {
    step     : 'hr.activation-functions',
    introKeys: ['pages.glossary.activation-functions.text-1'],
    groups   : [
      {
        titleKey: 'pages.glossary.activation-functions.sub-title-1',
        terms   : [activationTerm('linear', '$$ Linear(x) = x $$', IMGLinear, 'Identity')],
      },
      {
        titleKey: 'pages.glossary.activation-functions.sub-title-2',
        terms   : [
          activationTerm('sigmoid', '$$ Sigmoid(x) = \\sigma(x) = \\frac{1}{1 + e^{-x}} $$', IMGSigmoid, 'Sigmoid'),
          activationTerm('hard-sigmoid', '$$ Hardsigmoid(x) = \\begin{cases} 0 & x \\leq -3 \\\\ 1 & x \\geq +3 \\\\ x/6 + 1/2 & \\text{otherwise} \\end{cases} $$', IMGHardSigmoid, 'Hardsigmoid'),
          activationTerm('relu', '$$ ReLU(x) = (x)^+ = \\max(0, x) $$', IMGReLU, 'ReLU'),
          activationTerm('relu6', '$$ ReLU6(x) = \\min(\\max(0, x), 6) $$', IMGReLU6, 'ReLU6'),
          activationTerm('leaky-relu', '$$ LeakyReLU(x) = \\begin{cases} x & x > 0 \\\\ negative\\_slope \\cdot x & x \\leq 0 \\end{cases} $$', IMGLeakyReLU, 'LeakyReLU'),
          activationTerm('elu', '$$ ELU(x) = \\begin{cases} x & x > 0 \\\\ \\alpha (e^{x} - 1) & x \\leq 0 \\end{cases} $$', IMGELU, 'ELU'),
          activationTerm('tanh', '$$ Tanh(x) = \\frac{e^{x} - e^{-x}}{e^{x} + e^{-x}} $$', IMGTanh, 'Tanh'),
          activationTerm('soft-plus', '$$ Softplus(x) = \\frac{1}{\\beta} \\log(1 + e^{\\beta x}) $$', IMGSoftPlus, 'Softplus'),
          activationTerm('mish', '$$ Mish(x) = x \\cdot Tanh(Softplus(x)) $$', IMGMish, 'Mish'),
          activationTerm('selu', '$$ \\begin{split} SELU(x) &= scale \\cdot (\\max(0, x) + \\min(0, \\alpha (e^x - 1))) \\\\ \\alpha &= 1.6732632423543772848170429916717 \\\\ scale &= 1.0507009873554804934193349852946 \\end{split} $$', IMGSELU, 'SELU'),
        ],
      },
      {
        titleKey: 'pages.glossary.activation-functions.sub-title-3',
        terms   : [activationTerm('softmax', '$$ \\sigma(z_i) = \\frac{e^{z_{i}}}{\\sum_{j=1}^K e^{z_{j}}} \\quad i = 1, 2, \\dots, K $$', undefined, 'Softmax')],
      },
    ],
    references: [{ href: 'https://js.tensorflow.org/api/latest/#Layers-Advanced%20Activation', label: 'TensorFlow.js · Layers / Advanced Activation' }],
  },
  {
    step     : 'hr.loss-functions',
    introKeys: range('pages.glossary.loss-functions.text.', 0, 2),
    groups   : [
      // Las mismas pérdidas que ofrece el selector del editor de hiperparámetros
      { titleKey: 'pages.playground.generator.general-parameters.loss-group-classification', terms: TYPE_LOSSES_CLASSIFICATION.map(lossTerm) },
      { titleKey: 'pages.playground.generator.general-parameters.loss-group-regression', terms: TYPE_LOSSES_REGRESSION.map(lossTerm) },
      {
        titleKey: 'pages.glossary.loss-functions.related',
        terms   : [
          {
            id           : 'loss-negative-log-likelihood',
            titleKey     : 'equations.loss-functions.negative-log.title',
            paragraphKeys: [],
            math         : [
              '$$ NLL(y) = -\\log(p(y)) $$',
              { noteKey: 'equations.loss-functions.negative-log.text-1' },
              '$$ \\min_{\\theta} \\sum_y -\\log(p(y;\\theta)) $$',
              { noteKey: 'equations.loss-functions.negative-log.text-2' },
              '$$ \\max_{\\theta} \\prod_y p(y;\\theta) $$',
            ],
          },
          { id: 'loss-rmse', titleKey: 'equations.loss-functions.rmse.title', paragraphKeys: [], math: ['$$ RMSE = \\sqrt{\\frac{1}{m}\\sum^{m}_{i=1}(\\hat{y}^{(i)} - y^{(i)})^2} $$'] },
          {
            id           : 'loss-huber',
            titleKey     : 'equations.loss-functions.huber-loss.title',
            paragraphKeys: [],
            math         : [
              { noteKey: 'equations.loss-functions.huber-loss.text-1' },
              '$$ L_{\\delta} = \\begin{cases} \\frac{1}{2}(y - \\hat{y})^{2} & |y - \\hat{y}| < \\delta \\\\ \\delta \\left(|y - \\hat{y}| - \\frac{1}{2}\\delta\\right) & \\text{otherwise} \\end{cases} $$',
            ],
          },
        ],
      },
    ],
    references: [{ href: 'https://js.tensorflow.org/api/latest/#tf.LayersModel.compile', label: 'TensorFlow.js · tf.LayersModel.compile (loss)' }],
  },
  {
    step     : 'hr.metric-function',
    introKeys: range('pages.glossary.metric-functions.text-', 1, 4),
    groups   : [{
      id   : 'metrics',
      terms: [
        metricTerm('CategoricalAccuracy', [ACCURACY]),
        metricTerm('BinaryAccuracy', [ACCURACY]),
        metricTerm('CategoricalCrossentropy', [LOSS_FORMULAS.categoricalCrossentropy]),
        metricTerm('BinaryCrossentropy', [LOSS_FORMULAS.binaryCrossentropy]),
        metricTerm('CosineProximity', LOSS_FORMULAS.cosine),
        metricTerm('MeanAbsoluteError', [LOSS_FORMULAS.mae]),
        metricTerm('MeanAbsolutePercentageError', [LOSS_FORMULAS.mape]),
        metricTerm('MeanSquaredError', [LOSS_FORMULAS.mse]),
        {
          id           : 'metric-confusion-matrix',
          titleKey     : 'pages.glossary.metric-functions.confusion.title',
          paragraphKeys: ['pages.glossary.metric-functions.confusion.description'],
          math         : [
            ACCURACY,
            '$$ Precision = \\frac{TP}{TP+FP} $$',
            '$$ Recall = Sensitivity = \\frac{TP}{TP+FN} $$',
            '$$ F1 = \\frac{2 \\cdot Precision \\cdot Recall}{Precision+Recall} = \\frac{2 \\cdot TP}{2 \\cdot TP+FP+FN} $$',
            '$$ Specificity = \\frac{TN}{FP+TN} $$',
            { noteKey: 'equations.metric-functions.sen-spe-auc.text-1' },
          ],
          confusionLegend: true,
        },
      ],
    }],
    references: [
      { href: 'https://js.tensorflow.org/api/latest/#Metrics', label: 'TensorFlow.js · Metrics' },
      { href: 'https://www.iartificial.net/precision-recall-f1-accuracy-en-clasificacion/', label: 'Precision, Recall, F1, Accuracy en clasificación' },
    ],
  },
]

/** Todas las claves de i18n que usa el glosario (para comprobar que están en todos los idiomas) */
export function glossaryKeys(): string[] {
  const keys: string[] = []
  for (const section of GLOSSARY_SECTIONS) {
    keys.push(section.step, ...section.introKeys)
    for (const group of section.groups) {
      if (group.titleKey) keys.push(group.titleKey)
      for (const term of group.terms) {
        if (term.titleKey) keys.push(term.titleKey)
        keys.push(...term.paragraphKeys)
        for (const item of term.math ?? []) if (typeof item !== 'string') keys.push(item.noteKey)
      }
    }
  }
  return keys
}

export const termTitle = (term: GlossaryTerm_t, t: TFunction) => term.title ?? t(term.titleKey ?? '')

/** Valores de un objeto de i18n (las características de una activación); vacío si la clave no existe */
export function termCharacteristics(term: GlossaryTerm_t, t: TFunction): string[] {
  if (term.characteristicsKey === undefined) return []
  const value: unknown = t(term.characteristicsKey, { returnObjects: true })
  return value !== null && typeof value === 'object' ? Object.values(value as Record<string, string>) : []
}

/** Para buscar: minúsculas y sin tildes ("Época" encuentra "epoca" y al revés) */
export const normalizeSearch = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Texto de un término en el que se busca: título, descripción y características (sin etiquetas HTML) */
export function termSearchText(term: GlossaryTerm_t, t: TFunction): string {
  const parts = [termTitle(term, t), ...term.paragraphKeys.map((key) => t(key)), ...termCharacteristics(term, t)]
  return normalizeSearch(parts.join(' ').replace(/<[^>]+>/g, ' '))
}

/** ¿El texto (ya normalizado) tiene todas las palabras de la búsqueda? */
export function matchesSearch(text: string, query: string): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter((word) => word !== '')
  return words.every((word) => text.includes(word))
}

/** Textos de la página que no son de ningún término (el test comprueba que están en los tres idiomas) */
export const GLOSSARY_UI_KEYS = [
  'pages.glossary.intro',
  'pages.glossary.search',
  'pages.glossary.search-placeholder',
  'pages.glossary.no-results',
  'pages.glossary.anchor',
  'pages.glossary.plot',
  'pages.glossary.references-title',
  'pages.glossary.plot-tabs.image',
  'pages.glossary.plot-tabs.animation',
  'pages.glossary.animation.slider',
  'pages.glossary.animation.play',
  'pages.glossary.animation.pause',
]
