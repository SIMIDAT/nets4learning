import {
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY
} from '@pages/playground/0_TabularClassification/models'
import {
  MODEL_1_SALARY,
  MODEL_2_AUTO_MPG,
  MODEL_3_BOSTON_HOUSING,
  MODEL_4_BREAST_CANCER,
  MODEL_5_STUDENT_PERFORMANCE,
  MODEL_6_WINE
} from '@pages/playground/1_LinearRegression/models'
import {
  MODEL_FACE_DETECTOR,
  MODEL_FACE_MESH,
  MODEL_MOVE_NET_POSE_NET,
  MODEL_COCO_SSD
} from '@pages/playground/2_ObjectDetection/models'
import {
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET
} from '@pages/playground/3_ImageClassification/models'

const TASKS = {
  TABULAR_CLASSIFICATION: 'tabular-classification',
  LINEAR_REGRESSION     : 'linear-regression',
  IMAGE_CLASSIFICATION  : 'image-classification',
  OBJECT_DETECTION      : 'object-detection'
}

const UPLOAD = 'UPLOAD'

const LIST_MODELS_TABULAR_CLASSIFICATION = [
  UPLOAD,
  MODEL_CAR.KEY,
  MODEL_IRIS.KEY,
  MODEL_LYMPHOGRAPHY.KEY
]

const LIST_MODELS_LINEAR_REGRESSION = [
  UPLOAD,
  MODEL_1_SALARY.KEY,
  MODEL_2_AUTO_MPG.KEY,
  MODEL_3_BOSTON_HOUSING.KEY,
  MODEL_4_BREAST_CANCER.KEY,
  // MODEL_5_STUDENT_PERFORMANCE.KEY,
  MODEL_6_WINE.KEY
]

const LIST_MODELS_OBJECT_DETECTION = [
  UPLOAD,
  MODEL_FACE_DETECTOR.KEY,
  MODEL_FACE_MESH.KEY,
  MODEL_MOVE_NET_POSE_NET.KEY,
  MODEL_COCO_SSD.KEY
]

const LIST_MODELS_IMAGE_CLASSIFICATION = [
  UPLOAD,
  MODEL_IMAGE_MNIST.KEY,
  MODEL_IMAGE_MOBILENET.KEY,
  MODEL_IMAGE_RESNET.KEY
]

export const LIST_MODEL_OPTIONS_IDS = {
  TABULAR_CLASSIFICATION: {
    // 0
    0: UPLOAD,
    1: MODEL_CAR.KEY,
    2: MODEL_IRIS.KEY,
    3: MODEL_LYMPHOGRAPHY.KEY,
  },
  LINEAR_REGRESSION     : {
    // 1
    0: UPLOAD,
    1: MODEL_1_SALARY.KEY,
    2: MODEL_2_AUTO_MPG.KEY,
    3: MODEL_3_BOSTON_HOUSING.KEY,
    4: MODEL_4_BREAST_CANCER.KEY,
    // 5: MODEL_5_STUDENT_PERFORMANCE.KEY,
    6: MODEL_6_WINE.KEY
  },
  OBJECT_DETECTION      : {
    // 2
    0: UPLOAD,
    1: MODEL_FACE_DETECTOR.KEY,
    2: MODEL_FACE_MESH.KEY,
    3: MODEL_MOVE_NET_POSE_NET.KEY,
    4: MODEL_COCO_SSD.KEY
  },
  IMAGE_CLASSIFICATION  : {
    // 3
    0: UPLOAD,
    1: MODEL_IMAGE_MNIST.KEY,
    2: MODEL_IMAGE_MOBILENET.KEY,
    3: MODEL_IMAGE_RESNET.KEY
  }
}

const TASK_MODEL_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-1', value: MODEL_CAR.KEY, },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-2', value: MODEL_IRIS.KEY, },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-3', value: MODEL_LYMPHOGRAPHY.KEY, },
  ],
  [TASKS.LINEAR_REGRESSION]     : [
    { i18n: 'datasets-models.1-linear-regression.list-models.salary', value: MODEL_1_SALARY.KEY, },
    { i18n: 'datasets-models.1-linear-regression.list-models.auto-mpg', value: MODEL_2_AUTO_MPG.KEY, },
    { i18n: 'datasets-models.1-linear-regression.list-models.boston-housing', value: MODEL_3_BOSTON_HOUSING.KEY, },
    { i18n: 'datasets-models.1-linear-regression.list-models.breast-cancer', value: MODEL_4_BREAST_CANCER.KEY, },
    // { i18n: 'datasets-models.1-linear-regression.list-models.student-performance', value: MODEL_5_STUDENT_PERFORMANCE.KEY, },
    { i18n: 'datasets-models.1-linear-regression.list-models.wine', value: MODEL_6_WINE.KEY, },
  ],
  [TASKS.OBJECT_DETECTION]      : [
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-1', value: MODEL_FACE_DETECTOR.KEY, },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-2', value: MODEL_FACE_MESH.KEY, },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-3', value: MODEL_MOVE_NET_POSE_NET.KEY, },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-4', value: MODEL_COCO_SSD.KEY, },
  ],
  [TASKS.IMAGE_CLASSIFICATION]  : [
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-1', value: MODEL_IMAGE_MNIST.KEY, },
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-2', value: MODEL_IMAGE_MOBILENET.KEY, },
  ],
}
const TASK_MODEL_OPTIONS_CLASS = {
  [TASKS.TABULAR_CLASSIFICATION]: {
    [MODEL_CAR.KEY]         : { _class_: MODEL_CAR, },
    [MODEL_IRIS.KEY]        : { _class_: MODEL_IRIS, },
    [MODEL_LYMPHOGRAPHY.KEY]: { _class_: MODEL_LYMPHOGRAPHY, },
  },
  [TASKS.LINEAR_REGRESSION]     : {
    [MODEL_1_SALARY.KEY]             : { _class_: MODEL_1_SALARY, },
    [MODEL_2_AUTO_MPG.KEY]           : { _class_: MODEL_2_AUTO_MPG, },
    [MODEL_3_BOSTON_HOUSING.KEY]     : { _class_: MODEL_3_BOSTON_HOUSING, },
    [MODEL_4_BREAST_CANCER.KEY]      : { _class_: MODEL_4_BREAST_CANCER, },
    // [MODEL_5_STUDENT_PERFORMANCE.KEY]: { _class_: MODEL_5_STUDENT_PERFORMANCE, },
    [MODEL_6_WINE.KEY]               : { _class_: MODEL_6_WINE, },
  },
  [TASKS.OBJECT_DETECTION]      : {
    [MODEL_FACE_DETECTOR.KEY]    : { _class_: MODEL_FACE_DETECTOR, },
    [MODEL_FACE_MESH.KEY]        : { _class_: MODEL_FACE_MESH, },
    [MODEL_MOVE_NET_POSE_NET.KEY]: { _class_: MODEL_MOVE_NET_POSE_NET, },
    [MODEL_COCO_SSD.KEY]         : { _class_: MODEL_COCO_SSD, },
  },
  [TASKS.IMAGE_CLASSIFICATION]  : {
    [MODEL_IMAGE_MNIST.KEY]    : { _class_: MODEL_IMAGE_MNIST, },
    [MODEL_IMAGE_MOBILENET.KEY]: { _class_: MODEL_IMAGE_MOBILENET, },
  },
}

const TASK_DATASET_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'pages.menu-selection-dataset.0-tabular-classification.csv', value: UPLOAD },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-1', value: MODEL_CAR.KEY },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-2', value: MODEL_IRIS.KEY },
    { i18n: 'datasets-models.0-tabular-classification.list-datasets.0-option-3', value: MODEL_LYMPHOGRAPHY.KEY },
  ],
  [TASKS.LINEAR_REGRESSION]     : [
    { i18n: 'pages.menu-selection-dataset.1-linear-regression.csv', value: UPLOAD },
    { i18n: 'datasets-models.1-linear-regression.list-datasets.salary', value: MODEL_1_SALARY.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-datasets.auto-mpg', value: MODEL_2_AUTO_MPG.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-datasets.boston-housing', value: MODEL_3_BOSTON_HOUSING.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-datasets.breast-cancer', value: MODEL_4_BREAST_CANCER.KEY },
    // { i18n: 'datasets-models.1-linear-regression.list-datasets.student-performance', value: MODEL_5_STUDENT_PERFORMANCE.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-datasets.wine', value: MODEL_6_WINE.KEY },
  ],
  [TASKS.OBJECT_DETECTION]      : [],
  [TASKS.IMAGE_CLASSIFICATION]  : [
    { i18n: 'datasets-models.3-image-classification.list-datasets.mnist', value: MODEL_IMAGE_MNIST.KEY },
  ],
}




export {
  TASKS,
  TASK_MODEL_OPTIONS,
  TASK_MODEL_OPTIONS_CLASS,

  TASK_DATASET_OPTIONS,

  // Genérico para todos
  UPLOAD,

  // Clasificación tabular
  LIST_MODELS_TABULAR_CLASSIFICATION,
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY,

  // Regresión lineal
  LIST_MODELS_LINEAR_REGRESSION,
  MODEL_1_SALARY,
  MODEL_2_AUTO_MPG,
  MODEL_3_BOSTON_HOUSING,
  MODEL_4_BREAST_CANCER,
  MODEL_5_STUDENT_PERFORMANCE,
  MODEL_6_WINE,

  // Identificación de objetos
  LIST_MODELS_OBJECT_DETECTION,
  MODEL_FACE_DETECTOR,
  MODEL_FACE_MESH,
  MODEL_MOVE_NET_POSE_NET,
  MODEL_COCO_SSD,

  // Clasificación por imágenes
  LIST_MODELS_IMAGE_CLASSIFICATION,
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET,

}