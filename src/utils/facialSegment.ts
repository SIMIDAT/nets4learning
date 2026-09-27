interface FacePoint {
  x: number;
  y: number;
}

interface FaceLayer {
  id     : number;
  name   : string;
  indices: number[];
}

/** Nombre de cada zona del mapa facial, indexado por su id (0 = fondo, fuera de la cara). */
export const FACE_SEGMENT_NAMES = [
  'background',
  'skin',
  'lips',
  'rightEye',
  'leftEye',
  'rightEyebrow',
  'leftEyebrow',
  'nose',
] as const

export interface FaceSegmentResult {
  mapArray   : Uint8Array;
  numSegments: number;
}

export function getFaceSegmentMap(
  prediccion: FacePoint[],
  width: number,
  height: number,
  flipHorizontal = false,
): FaceSegmentResult {
  // 1. Sanitización de dimensiones
  const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
  const safeHeight = Number.isFinite(height)
    ? Math.max(0, Math.floor(height))
    : 0;
  const totalPixels = safeWidth * safeHeight;

  // Inicializar mapa vacío
  const segmentMap = new Uint8Array(totalPixels);

  const emptyResult: FaceSegmentResult = {
    mapArray   : segmentMap,
    numSegments: 0, // Importante: 0 segmentos si no hay cara
  };

  if (totalPixels === 0 || !prediccion || prediccion.length === 0) {
    return emptyResult;
  }

  const LAYERS: FaceLayer[] = [
    {
      id     : 1,
      name   : 'skin',
      indices: [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
        379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
        127, 162, 21, 54, 103, 67, 109,
      ],
    },
    {
      id     : 2,
      name   : 'lips',
      indices: [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267,
        0, 37, 39, 40, 185,
      ],
    },
    {
      id     : 3,
      name   : 'rightEye',
      indices: [
        33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144,
        163, 7,
      ],
    },
    {
      id     : 4,
      name   : 'leftEye',
      indices: [
        263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373,
        390, 249,
      ],
    },
    {
      id     : 5,
      name   : 'rightEyebrow',
      indices: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    },
    {
      id     : 6,
      name   : 'leftEyebrow',
      indices: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
    },
    { id: 7, name: 'nose', indices: [168, 351, 329, 326, 2, 97, 100, 122] },
  ];

  // Rasterizamos cada polígono a mano (centro de píxel dentro/fuera, regla par-impar) en vez
  // de rellenarlo en un canvas: el antialiasing del canvas mezcla los ids en los bordes y
  // genera ids de otras capas (p. ej. entre nariz=7 y piel=1 aparecían ojos o labios).
  // Las capas posteriores sobrescriben a las anteriores (la piel queda debajo).
  let paintedLayers = 0;
  for (const layer of LAYERS) {
    const polygon = layer.indices
      .map((idx) => prediccion[idx])
      .filter((p): p is FacePoint => Boolean(p))
      .map((p) => ({ x: flipHorizontal ? safeWidth - p.x : p.x, y: p.y }));
    if (polygon.length < 3) continue;
    fillPolygon(segmentMap, safeWidth, safeHeight, polygon, layer.id);
    paintedLayers++;
  }

  if (paintedLayers === 0) return emptyResult;
  return {
    mapArray   : segmentMap,
    numSegments: LAYERS.length + 1, // + fondo (id 0)
  };
}

/** Pinta `value` en los píxeles cuyo centro cae dentro del polígono (regla par-impar). */
function fillPolygon(
  map: Uint8Array,
  width: number,
  height: number,
  polygon: FacePoint[],
  value: number,
): void {
  const ys = polygon.map((p) => p.y);
  const yMin = Math.max(0, Math.floor(Math.min(...ys)));
  const yMax = Math.min(height - 1, Math.ceil(Math.max(...ys)));

  for (let y = yMin; y <= yMax; y++) {
    const cy = y + 0.5;
    // Intersecciones de la fila con las aristas del polígono.
    const xs: number[] = [];
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i];
      const b = polygon[j];
      if ((a.y > cy) !== (b.y > cy)) {
        xs.push(a.x + ((cy - a.y) * (b.x - a.x)) / (b.y - a.y));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xStart = Math.max(0, Math.ceil(xs[k] - 0.5));
      const xEnd = Math.min(width - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = xStart; x <= xEnd; x++) map[y * width + x] = value;
    }
  }
}
