const DEFAULT_LEARNING_RATE = 1
const DEFAULT_NUMBER_EPOCHS = 5
const DEFAULT_TEST_SIZE = 10
const DEFAULT_ID_OPTIMIZATION = 'adam'
const DEFAULT_ID_LOSS = 'metrics-categoricalCrossentropy'
const DEFAULT_ID_METRICS = ['categoricalCrossentropy']

const DEFAULT_LAYERS = [
  {
    _class    : 'conv2d',
    _protected: true,
    inputShape: [28, 28, 1],
    kernelSize: 3,
    filters   : 16,
    activation: 'relu',
  },
  {
    _class  : 'maxPooling2d',
    poolSize: 2,
    strides : 2,
  },
  {
    _class    : 'conv2d',
    kernelSize: 3,
    filters   : 32,
    activation: 'relu'
  },
  {
    _class  : 'maxPooling2d',
    poolSize: 2,
    strides : 2,
  }
]

export {
  DEFAULT_LAYERS,

  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,

  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
}