import I_MODEL_OBJECT_DETECTION from './_model'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import type { ModelRegistry } from '@core/models/modelRegistry'

/**
 * Clases de modelos de detección, cargadas bajo demanda: cada una arrastra librerías pesadas
 * (mediapipe, face-api, pose-detection, coco-ssd…) que solo se descargan al usar ese modelo.
 */
const MAP_OD_CLASSES: ModelRegistry<I_MODEL_OBJECT_DETECTION> = {
  [OD_MODEL_KEYS.FACE_DETECTOR]    : () => import('./MODEL_1_FACE_DETECTOR').then((m) => m.MODEL_1_FACE_DETECTOR),
  [OD_MODEL_KEYS.FACE_MESH]        : () => import('./MODEL_2_FACE_MESH').then((m) => m.MODEL_2_FACE_MESH),
  [OD_MODEL_KEYS.MOVE_NET_POSE_NET]: () => import('./MODEL_3_MOVE_NET_POSE_NET').then((m) => m.MODEL_3_MOVE_NET_POSE_NET),
  [OD_MODEL_KEYS.COCO_SSD]         : () => import('./MODEL_4_COCO_SSD').then((m) => m.MODEL_4_COCO_SSD),
  [OD_MODEL_KEYS.FACE_API]         : () => import('./MODEL_5_FACE_API').then((m) => m.MODEL_5_FACE_API),
  [OD_MODEL_KEYS.HAND_SIGN]        : () => import('./MODEL_6_HAND_SIGN').then((m) => m.MODEL_6_HAND_SIGN),
}

export {
  MAP_OD_CLASSES,
  I_MODEL_OBJECT_DETECTION,
}
