import {
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY
} from "./pages/playground/0_TabularClassification/models";
import {
  MODEL_FACE_DETECTOR,
  MODEL_FACE_MESH,
  MODEL_MOVE_NET_POSE_NET,
  MODEL_COCO_SSD
} from "./pages/playground/2_ObjectDetection/models";
import {
  MODEL_IMAGE_MNIST,
  MODEL_IMAGE_MOBILENET,
  MODEL_IMAGE_RESNET
} from "./pages/playground/3_ImageClassification/models";

const MODEL_UPLOAD = "UPLOAD"


const LIST_MODELS_TABULAR_CLASSIFICATION = [
  MODEL_UPLOAD,
  MODEL_CAR.KEY,
  MODEL_IRIS.KEY,
  MODEL_LYMPHOGRAPHY.KEY
]

const LIST_MODELS_OBJECT_DETECTION = [
  MODEL_UPLOAD,
  MODEL_FACE_DETECTOR.KEY,
  MODEL_FACE_MESH.KEY,
  MODEL_MOVE_NET_POSE_NET.KEY,
  MODEL_COCO_SSD.KEY
]

const LIST_MODELS_IMAGE_CLASSIFICATION = [
  MODEL_UPLOAD,
  MODEL_IMAGE_MNIST.KEY,
  MODEL_IMAGE_MOBILENET.KEY,
  MODEL_IMAGE_RESNET.KEY
]

const LIST_TYPE_MODALITY = [
  'Clasificación tabular',
  'Regresión lineal',
  'Identificación de objetos',
  'Clasificador de imágenes',
]

const LIST_MODEL_OPTIONS = [
  [
    'SUBIR CONJUNTO DE DATOS PROPIO',
    'Clasificación de coches',
    'Clasificación de flor iris',
    'Clasificación de linfomas',
  ],
  [],
  [
    'SUBIR MODELO PROPIO',
    'FACE DETECTOR - Geometría facial',
    "FACE MESH - Malla facial",
    "MOVE NET - Detector de articulaciones",
    "COCO SSD - Detector de objetos"
  ],
  [
    'SUBIR MODELO PROPIO',
    'MNIST - Clasificación de números',
    'MOBILENET - Clasificador de imágenes',
    // TODO :3
    // 'RESNET V2 - Clasificador de imágenes'
  ],
]


export const LIST_MODEL_OPTIONS_IDS = {
  TABULAR_CLASSIFICATION: {
    // 0
    0: MODEL_UPLOAD,
    1: MODEL_CAR.KEY,
    2: MODEL_IRIS.KEY,
    3: MODEL_LYMPHOGRAPHY.KEY,
  },
  LINEAR_REGRESSION     : {
    // 1
  },
  OBJECT_DETECTION      : {
    // 2
    0: MODEL_UPLOAD,
    1: MODEL_FACE_DETECTOR.KEY,
    2: MODEL_FACE_MESH.KEY,
    3: MODEL_MOVE_NET_POSE_NET.KEY,
    4: MODEL_COCO_SSD.KEY
  },
  IMAGE_CLASSIFICATION  : {
    // 3
    0: MODEL_UPLOAD,
    1: MODEL_IMAGE_MNIST.KEY,
    2: MODEL_IMAGE_MOBILENET.KEY,
    3: MODEL_IMAGE_RESNET.KEY
  }
}

export const DATASET_DESCRIPTION = [
  [
    'DATASET PROPIO',
    <>TEXT DESCRIPTION CAR</>,
    <>TEXT DESCRIPTION IRIS</>,
    <>TEXT DESCRIPTION LYMPHOGRAPHY</>
  ],
  [],
  [
    'DATASET PROPIO',
    <>TEXT DESCRIPTION FACE-DETECTION</>,
    <>TEXT DESCRIPTION FACE-MESH</>,
    <>TEXT DESCRIPTION POSE-NET</>,
    <>TEXT DESCRIPTION COCO-SSD</>
  ],
  [
    'DATASET PROPIO',
    <>TEXT DESCRIPTION MNIST</>,
    <>TEXT DESCRIPTION MOBILENET</>,
    <>TEXT DESCRIPTION RESNET</>,
  ],
]

export const getHTML_DATASET_DESCRIPTION = (row, dataset) => {
  return DATASET_DESCRIPTION[row][dataset];
}

const getKeyDatasetByID_TabularClassification = (id) => {
  switch (id.toString()) {
    case '0':
      return MODEL_UPLOAD
    case '1':
      return MODEL_CAR.KEY
    case '2':
      return MODEL_IRIS.KEY
    case '3':
      return MODEL_LYMPHOGRAPHY.KEY
    default:
      console.error("Error, opción no disponible")
  }
}


const getKeyDatasetByID_ObjectDetection = (id) => {
  switch (id.toString()) {
    case '0':
      return MODEL_UPLOAD
    case '1':
      return MODEL_FACE_DETECTOR.KEY
    case '2':
      return MODEL_FACE_MESH.KEY
    case '3':
      return MODEL_MOVE_NET_POSE_NET.KEY
    case '4':
      return MODEL_COCO_SSD.KEY
    default:
      console.error("Error, opción no disponible")
  }
}
// TODO
const getKeyDatasetByID_ImageClassification = (id) => {
  switch (id.toString()) {
    case '0':
      return MODEL_UPLOAD
    case '1':
      return MODEL_IMAGE_MNIST.KEY
    case '2':
      return MODEL_IMAGE_MOBILENET.KEY
    case '3':
      return MODEL_IMAGE_RESNET.KEY
    default:
      console.error("Error, opción no disponible")
  }
}

const LIST_OF_IMAGES_MNIST = [
  "0_new.png",
  "1_new.png",
  "2_new.png",
  "3_new.png",
  "4_new.png",
  "5_new.png",
  "6_new.png",
  "7_new.png",
  "8_new.png",
  "9_new.png"
]

const LIST_OF_IMAGES_MOBILENET = [
  "beef-burger.jpg",
  "bulldog.jpg",
  "butterfly.jpg",
  "cat.jpg",
  "cheetah.jpg",
  "cruise.jpg",
  "duck.jpg",
  "elephant.jpg",
  "lion.jpg",
]

export {
  getKeyDatasetByID_TabularClassification,
  getKeyDatasetByID_ObjectDetection,
  getKeyDatasetByID_ImageClassification,
  LIST_MODEL_OPTIONS,
  LIST_TYPE_MODALITY,
  // Genérico para todos
  MODEL_UPLOAD,
  // Clasificación tabular
  LIST_MODELS_TABULAR_CLASSIFICATION,
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY,
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
  LIST_OF_IMAGES_MNIST,
  LIST_OF_IMAGES_MOBILENET,
}