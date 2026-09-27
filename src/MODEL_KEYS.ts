// Identificadores de los modelos/datasets de cada tarea. Viven aparte de las clases para que
// menús, rutas y registros puedan usarlos sin importar (y descargar) los modelos.
// Cada clase de modelo los usa como `static KEY`: son la única fuente de verdad.

export const TC_MODEL_KEYS = {
  UPLOAD      : 'UPLOAD',
  CAR         : 'CAR',
  IRIS        : 'IRIS',
  LYMPHOGRAPHY: 'LYMPHOGRAPHY',
} as const

export const LR_MODEL_KEYS = {
  SALARY             : 'SALARY',
  AUTO_MPG           : 'AUTO_MPG',
  HOUSING_PRICES     : 'HOUSING_PRICES',
  BREAST_CANCER      : 'BREAST_CANCER',
  STUDENT_PERFORMANCE: 'STUDENT_PERFORMANCE',
  WINE               : 'WINE',
} as const

export const OD_MODEL_KEYS = {
  FACE_DETECTOR    : 'FACE-DETECTOR',
  FACE_MESH        : 'FACE-MESH',
  MOVE_NET_POSE_NET: 'MOVE-NET--POSE-NET',
  COCO_SSD         : 'COCO-SSD',
  FACE_API         : 'FACE-API',
  HAND_SIGN        : 'HAND-SIGN',
} as const

export const IC_MODEL_KEYS = {
  MNIST    : 'IMAGE-MNIST',
  KMNIST   : 'IMAGE-KMNIST',
  MOBILENET: 'IMAGE-MOBILENET',
  RESNET   : 'IMAGE-RESNET',
} as const
