import {
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY,
} from '@pages/playground/0_TabularClassification/models'
import {
  MODEL_1_SALARY,
  MODEL_2_AUTO_MPG,
  MODEL_3_BOSTON_HOUSING,
  MODEL_4_BREAST_CANCER,
  MODEL_5_STUDENT_PERFORMANCE,
  MODEL_6_WINE,
} from '@pages/playground/1_LinearRegression/models'
import {
  MODEL_FACE_DETECTOR,
  MODEL_FACE_MESH,
  MODEL_MOVE_NET_POSE_NET,
  MODEL_COCO_SSD,
} from '@pages/playground/2_ObjectDetection/models'
import {
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_KMNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET,
} from '@pages/playground/3_ImageClassification/models'

const TASKS = {
  TABULAR_CLASSIFICATION: 'tabular-classification',
  LINEAR_REGRESSION     : 'linear-regression',
  IMAGE_CLASSIFICATION  : 'image-classification',
  OBJECT_DETECTION      : 'object-detection',
}

const UPLOAD = 'UPLOAD'

const TASK_MODEL_OPTIONS = {
  [TASKS.TABULAR_CLASSIFICATION]: [
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-1', value: MODEL_CAR.KEY },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-2', value: MODEL_IRIS.KEY },
    { i18n: 'datasets-models.0-tabular-classification.list-models.0-option-3', value: MODEL_LYMPHOGRAPHY.KEY },
  ],
  [TASKS.LINEAR_REGRESSION]     : [
    { i18n: 'datasets-models.1-linear-regression.list-models.salary', value: MODEL_1_SALARY.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-models.auto-mpg', value: MODEL_2_AUTO_MPG.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-models.boston-housing', value: MODEL_3_BOSTON_HOUSING.KEY },
    { i18n: 'datasets-models.1-linear-regression.list-models.breast-cancer', value: MODEL_4_BREAST_CANCER.KEY },
    // { i18n: 'datasets-models.1-linear-regression.list-models.student-performance', value: MODEL_5_STUDENT_PERFORMANCE.KEY, },
    { i18n: 'datasets-models.1-linear-regression.list-models.wine', value: MODEL_6_WINE.KEY },
  ],
  [TASKS.OBJECT_DETECTION]      : [
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-1', value: MODEL_FACE_DETECTOR.KEY },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-2', value: MODEL_FACE_MESH.KEY },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-3', value: MODEL_MOVE_NET_POSE_NET.KEY },
    { i18n: 'datasets-models.2-object-detection.list-models.2-option-4', value: MODEL_COCO_SSD.KEY },
  ],
  [TASKS.IMAGE_CLASSIFICATION]  : [
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-1', value: MODEL_IMAGE_MNIST.KEY },
    { i18n: 'datasets-models.3-image-classifier.list-models.3-option-2', value: MODEL_IMAGE_MOBILENET.KEY },
  ],
}
const TASK_MODEL_OPTIONS_CLASS = {
  [TASKS.TABULAR_CLASSIFICATION]: {
    [MODEL_CAR.KEY]         : { _class_: MODEL_CAR },
    [MODEL_IRIS.KEY]        : { _class_: MODEL_IRIS },
    [MODEL_LYMPHOGRAPHY.KEY]: { _class_: MODEL_LYMPHOGRAPHY },
  },
  [TASKS.LINEAR_REGRESSION]     : {
    [MODEL_1_SALARY.KEY]        : { _class_: MODEL_1_SALARY },
    [MODEL_2_AUTO_MPG.KEY]      : { _class_: MODEL_2_AUTO_MPG },
    [MODEL_3_BOSTON_HOUSING.KEY]: { _class_: MODEL_3_BOSTON_HOUSING },
    [MODEL_4_BREAST_CANCER.KEY] : { _class_: MODEL_4_BREAST_CANCER },
    // [MODEL_5_STUDENT_PERFORMANCE.KEY]: { _class_: MODEL_5_STUDENT_PERFORMANCE, },
    [MODEL_6_WINE.KEY]: { _class_: MODEL_6_WINE },
  },
  [TASKS.OBJECT_DETECTION]      : {
    [MODEL_FACE_DETECTOR.KEY]    : { _class_: MODEL_FACE_DETECTOR },
    [MODEL_FACE_MESH.KEY]        : { _class_: MODEL_FACE_MESH },
    [MODEL_MOVE_NET_POSE_NET.KEY]: { _class_: MODEL_MOVE_NET_POSE_NET },
    [MODEL_COCO_SSD.KEY]         : { _class_: MODEL_COCO_SSD },
  },
  [TASKS.IMAGE_CLASSIFICATION]  : {
    [MODEL_IMAGE_MNIST.KEY]    : { _class_: MODEL_IMAGE_MNIST },
    [MODEL_IMAGE_MOBILENET.KEY]: { _class_: MODEL_IMAGE_MOBILENET },
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
    // { i18n: 'datasets-models.3-image-classification.list-datasets.kmnist', value: MODEL_IMAGE_KMNIST.KEY },
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
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY,

  // Regresión lineal
  MODEL_1_SALARY,
  MODEL_2_AUTO_MPG,
  MODEL_3_BOSTON_HOUSING,
  MODEL_4_BREAST_CANCER,
  MODEL_5_STUDENT_PERFORMANCE,
  MODEL_6_WINE,

  // Identificación de objetos
  MODEL_FACE_DETECTOR,
  MODEL_FACE_MESH,
  MODEL_MOVE_NET_POSE_NET,
  MODEL_COCO_SSD,

  // Clasificación por imágenes
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_KMNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET,
}
