import { useRef, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface ShapHeatmapProps {
  imageSrc?          : ImageData | string;
  shapValues?        : number[] | number[][];
  /** Id de segmento por píxel, en el tamaño `segmentationWidth × segmentationHeight`. */
  segmentationMap?   : Int32Array | Uint8Array | number[] | null;
  segmentationWidth? : number;
  segmentationHeight?: number;
  opacity?           : number;
  title?             : string;
}

type SegmentMap = Int32Array | Uint8Array | number[];

/**
 * Devuelve el id de segmento de cada píxel del canvas (width × height).
 * - Con mapa de segmentación: se escala por vecino más cercano desde su tamaño original.
 * - Sin mapa: rejilla cuadrada con un valor por celda (p. ej. relevancia LRP por píxel).
 */
function buildCanvasSegmentMap(
  width: number,
  height: number,
  numValues: number,
  segmentationMap: SegmentMap | null,
  segmentationWidth?: number,
  segmentationHeight?: number,
): SegmentMap {
  let mapW = segmentationWidth ?? 0;
  let mapH = segmentationHeight ?? 0;
  if (segmentationMap && (!mapW || !mapH)) {
    // Sin dimensiones explícitas: mismo tamaño que el canvas o mapa cuadrado.
    if (segmentationMap.length === width * height) {
      mapW = width;
      mapH = height;
    } else {
      mapW = mapH = Math.round(Math.sqrt(segmentationMap.length));
    }
  }

  const out = new Int32Array(width * height);
  if (segmentationMap && mapW * mapH === segmentationMap.length) {
    for (let y = 0; y < height; y++) {
      const sy = Math.min(Math.floor((y * mapH) / height), mapH - 1);
      for (let x = 0; x < width; x++) {
        const sx = Math.min(Math.floor((x * mapW) / width), mapW - 1);
        out[y * width + x] = segmentationMap[sy * mapW + sx];
      }
    }
    return out;
  }

  const cols = Math.ceil(Math.sqrt(numValues));
  for (let y = 0; y < height; y++) {
    const row = Math.min(Math.floor((y * cols) / height), cols - 1);
    for (let x = 0; x < width; x++) {
      const col = Math.min(Math.floor((x * cols) / width), cols - 1);
      out[y * width + x] = row * cols + col;
    }
  }
  return out;
}

export default function ShapHeatmap(props: ShapHeatmapProps) {
  const {
    imageSrc,
    shapValues,
    segmentationMap = null,
    segmentationWidth,
    segmentationHeight,
    opacity = 0.6,
    title,
  } = props;
  const { t } = useTranslation();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !shapValues || shapValues.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const valuesToPaint: number[] = Array.isArray(shapValues[0])
      ? (shapValues[0] as number[])
      : (shapValues as number[]);

    // Se llama cuando el canvas ya tiene la imagen base y su tamaño real.
    const renderOverlay = () => {
      const { width, height } = canvas;
      const map = buildCanvasSegmentMap(
        width,
        height,
        valuesToPaint.length,
        segmentationMap,
        segmentationWidth,
        segmentationHeight,
      );

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let maxAbsValue = 0;
      for (const v of valuesToPaint) maxAbsValue = Math.max(maxAbsValue, Math.abs(v));
      if (maxAbsValue === 0) maxAbsValue = 1;

      for (let i = 0; i < map.length; i++) {
        const segmentId = map[i];
        if (segmentId < 0 || segmentId >= valuesToPaint.length) continue;

        const shapVal = valuesToPaint[segmentId];
        const absVal = Math.abs(shapVal);
        if (absVal < maxAbsValue * 0.05) continue;

        const alpha = (absVal / maxAbsValue) * opacity;
        const rOverlay = shapVal > 0 ? 255 : 0;
        const bOverlay = shapVal > 0 ? 0 : 255;

        const idx = i * 4;
        data[idx] = data[idx] * (1 - alpha) + rOverlay * alpha;
        data[idx + 1] = data[idx + 1] * (1 - alpha);
        data[idx + 2] = data[idx + 2] * (1 - alpha) + bOverlay * alpha;
      }

      ctx.putImageData(imgData, 0, 0);
    };

    if (imageSrc && typeof imageSrc === 'object' && imageSrc.data) {
      canvas.width = imageSrc.width;
      canvas.height = imageSrc.height;
      ctx.putImageData(imageSrc, 0, 0);
      renderOverlay();
      return;
    }

    if (typeof imageSrc === 'string' && imageSrc.length > 0) {
      // Si las props cambian antes de que cargue la imagen, ignoramos la carga antigua.
      let cancelled = false;
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (cancelled) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        renderOverlay();
      };
      img.src = imageSrc;
      return () => {
        cancelled = true;
      };
    }
  }, [imageSrc, shapValues, segmentationMap, segmentationWidth, segmentationHeight, opacity]);

  const legendSwatch = (background: string) => ({
    width       : 10,
    height      : 10,
    background,
    marginRight : 5,
    borderRadius: 2,
  });

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-2 text-center">
        {title && <h6 className="mb-2 text-body-secondary small">{title}</h6>}
        <canvas
          ref={canvasRef}
          className="border rounded"
          style={{
            width         : '100%',
            maxWidth      : '300px',
            height        : 'auto',
            imageRendering: 'pixelated',
          }}
        />
        <div className="d-flex justify-content-center gap-3 mt-2 small text-body-secondary">
          <div className="d-flex align-items-center">
            <span style={legendSwatch('rgba(255,0,0,0.6)')} />
            {t('ui.explain.positive')}
          </div>
          <div className="d-flex align-items-center">
            <span style={legendSwatch('rgba(0,0,255,0.6)')} />
            {t('ui.explain.negative')}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
