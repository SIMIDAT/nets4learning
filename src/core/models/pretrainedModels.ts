import { TASKS } from '@/TASKS'
import { IC_MODEL_KEYS, OD_MODEL_KEYS } from '@/MODEL_KEYS'

/** Un modelo preentrenado que se descarga al usarlo: su tarea, su clave (su página) y la clave i18n de su nombre */
export type PretrainedModel_t = { task: string, key: string, title: string }

/**
 * Los modelos preentrenados que se descargan de otras webs (MediaPipe, TF Hub, Google Storage) o de public/models/, y
 * cómo reconocer sus ficheros por su dirección: para decir en /settings cuáles están guardados en el navegador. Gana el
 * primero que encaja: los de face-api se llaman ssd_mobilenetv1… y los de COCO-SSD, ssdlite_mobilenet_v2…, así que van
 * antes que MobileNet
 */
const PRETRAINED_MODELS: Array<PretrainedModel_t & { match: RegExp }> = [
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.FACE_API, title: 'datasets-models.2-object-detection.face-api.title', match: /\/models\/02-object-detection\/face-api/ },
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.FACE_DETECTOR, title: 'datasets-models.2-object-detection.face-detection.title', match: /@mediapipe\/face_detection/ },
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.FACE_MESH, title: 'datasets-models.2-object-detection.face-mesh.title', match: /@mediapipe\/face_mesh/ },
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.HAND_SIGN, title: 'datasets-models.2-object-detection.hand-sign.title', match: /@mediapipe\/hands/ },
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.MOVE_NET_POSE_NET, title: 'datasets-models.2-object-detection.move-net--pose-net.title', match: /movenet/i },
  { task: TASKS.OBJECT_DETECTION, key: OD_MODEL_KEYS.COCO_SSD, title: 'datasets-models.2-object-detection.coco-ssd.title', match: /ssdlite_mobilenet|coco[-_]ssd/i },
  { task: TASKS.IMAGE_CLASSIFICATION, key: IC_MODEL_KEYS.MOBILENET, title: 'pages.settings.data.pretrained.mobilenet', match: /mobilenet/i },
]

/** El modelo al que pertenece un fichero descargado (null si no es de ninguno conocido) */
export function pretrainedModelOf(url: string): PretrainedModel_t | null {
  const found = PRETRAINED_MODELS.find(({ match }) => match.test(url))
  return found === undefined ? null : { task: found.task, key: found.key, title: found.title }
}
