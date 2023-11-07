const DEFAULT_LEARNING_RATE = 1
const DEFAULT_NUMBER_EPOCHS = 5
const DEFAULT_TEST_SIZE = 10
const DEFAULT_ID_OPTIMIZATION = 'adam'
const DEFAULT_ID_LOSS = 'metrics-categoricalCrossentropy'
const DEFAULT_ID_METRICS = ['categoricalCrossentropy']

const DEFAULT_BAR_DATA = {
  labels: [], datasets: [{
    label          : '',
    data           : [],
    backgroundColor: [
      'rgba(255, 99, 132, 0.4)',
      'rgba(255, 159, 64, 0.4)',
      'rgba(255, 205, 86, 0.4)',
      'rgba(75, 192, 192, 0.4)',
      'rgba(54, 162, 235, 0.4)',
      'rgba(153, 102, 255, 0.4)',
      'rgba(175, 175, 175, 0.4)'
    ],
    borderColor    : [
      'rgb(255, 99, 132)',
      'rgb(255, 159, 64)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(54, 162, 235)',
      'rgb(153, 102, 255)',
      'rgb(175, 175, 175)'
    ],
    borderWidth    : 1,
  }],
}

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
    activation: 'relu',
  },
  {
    _class  : 'maxPooling2d',
    poolSize: 2,
    strides : 2,
  },
]

export {
  DEFAULT_LAYERS,

  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,

  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,

  DEFAULT_BAR_DATA,
}
