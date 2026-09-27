interface FacePoint {
  x: number;
  y: number;
}

interface FaceLayer {
  id: number;
  name: string;
  indices: number[];
}

export interface FaceSegmentResult {
  mapArray: Uint8Array;
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
    mapArray: segmentMap,
    numSegments: 0, // Importante: 0 segmentos si no hay cara
  };

  if (
    typeof document === 'undefined' ||
    totalPixels === 0 ||
    !prediccion ||
    prediccion.length === 0
  ) {
    return emptyResult;
  }

  const LAYERS: FaceLayer[] = [
    {
      id: 1,
      name: 'skin',
      indices: [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
        379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
        127, 162, 21, 54, 103, 67, 109,
      ],
    },
    {
      id: 2,
      name: 'lips',
      indices: [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267,
        0, 37, 39, 40, 185,
      ],
    },
    {
      id: 3,
      name: 'rightEye',
      indices: [
        33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144,
        163, 7,
      ],
    },
    {
      id: 4,
      name: 'leftEye',
      indices: [
        263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373,
        390, 249,
      ],
    },
    {
      id: 5,
      name: 'rightEyebrow',
      indices: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    },
    {
      id: 6,
      name: 'leftEyebrow',
      indices: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
    },
    { id: 7, name: 'nose', indices: [168, 351, 329, 326, 2, 97, 100, 122] },
  ];

  try {
    const canvas = document.createElement('canvas');
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return emptyResult;

    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, safeWidth, safeHeight);

    LAYERS.forEach((layer) => {
      const firstIndex = layer.indices[0];
      if (!prediccion[firstIndex]) return;

      ctx.beginPath();
      const p0 = prediccion[firstIndex];
      // Si flipHorizontal, invertir coordenada X
      const x0 = flipHorizontal ? safeWidth - p0.x : p0.x;
      ctx.moveTo(x0, p0.y);

      for (let i = 1; i < layer.indices.length; i++) {
        const idx = layer.indices[i];
        const p = prediccion[idx];
        if (p) {
          // Si flipHorizontal, invertir coordenada X
          const x = flipHorizontal ? safeWidth - p.x : p.x;
          ctx.lineTo(x, p.y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = `rgb(${layer.id}, 0, 0)`;
      ctx.fill();
    });

    const imgData = ctx.getImageData(0, 0, safeWidth, safeHeight);
    const data = imgData.data;

    for (let i = 0; i < totalPixels; i++) {
      segmentMap[i] = data[i * 4];
    }

    return {
      mapArray: segmentMap,
      numSegments: LAYERS.length + 1,
    };
  } catch (err) {
    console.warn('Error generando mapa de segmentos:', err);
    return emptyResult;
  }
}
