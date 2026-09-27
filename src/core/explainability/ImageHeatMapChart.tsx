import { useRef, useEffect } from 'react';
import { Card } from 'react-bootstrap';

interface ShapHeatmapProps {
  imageSrc?: ImageData | string;
  shapValues?: number[] | number[][];
  segmentationMap?: Int32Array | Uint8Array | number[] | null;
  opacity?: number;
  title?: string;
}

export default function ShapHeatmap(props: ShapHeatmapProps) {
  const {
    imageSrc,
    shapValues,
    segmentationMap = null,
    opacity = 0.6,
    title = 'Mapa de Importancia (SHAP)',
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !shapValues || shapValues.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let valuesToPaint: number[] = Array.isArray(shapValues[0])
      ? (shapValues[0] as number[])
      : (shapValues as number[]);

    // Definimos renderOverlay PRIMERO. La generación del mapa se hará dentro,
    // cuando ya sepamos el tamaño real del canvas.
    const renderOverlay = () => {
      const width = canvas.width;
      const height = canvas.height;
      const totalPixels = width * height;

      // Calculamos/verificamos el mapa aquí dentro
      let activeMap: Int32Array | Uint8Array | number[] | null = segmentationMap;

      // Si no hay mapa o el tamaño no coincide, regeneramos el GRID
      if (!activeMap || activeMap.length !== totalPixels) {
        activeMap = new Int32Array(totalPixels);
        const totalCells = valuesToPaint.length;
        const gridSize = Math.sqrt(totalCells);
        const cols = Math.ceil(gridSize);

        const cellWidth = width / cols;
        const cellHeight = height / cols;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Aseguramos que no se salga de los índices
            const col = Math.min(Math.floor(x / cellWidth), cols - 1);
            const row = Math.min(Math.floor(y / cellHeight), cols - 1);

            activeMap[y * width + x] = row * cols + col;
          }
        }
      }

      const map = activeMap as Int32Array | Uint8Array | number[];

      // Pintamos usando el mapa correcto
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const maxAbsValue = Math.max(...valuesToPaint.map(Math.abs)) || 1;

      for (let i = 0; i < totalPixels; i++) {
        const segmentId = map[i];

        if (segmentId !== -1 && segmentId < valuesToPaint.length) {
          const shapVal = valuesToPaint[segmentId];
          const absVal = Math.abs(shapVal);

          if (absVal < maxAbsValue * 0.05) continue;

          const intensity = absVal / maxAbsValue;
          const alpha = intensity * opacity;

          const rOverlay = shapVal > 0 ? 255 : 0;
          const gOverlay = 0;
          const bOverlay = shapVal > 0 ? 0 : 255;

          const idx = i * 4;
          data[idx] = data[idx] * (1 - alpha) + rOverlay * alpha;
          data[idx + 1] = data[idx + 1] * (1 - alpha) + gOverlay * alpha;
          data[idx + 2] = data[idx + 2] * (1 - alpha) + bOverlay * alpha;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    // Carga de imagen
    if (imageSrc && typeof imageSrc === 'object' && imageSrc.data) {
      // Caso ImageData (ya tiene tamaño)
      canvas.width = imageSrc.width;
      canvas.height = imageSrc.height;
      ctx.putImageData(imageSrc, 0, 0);
      renderOverlay();
    } else if (typeof imageSrc === 'string' && imageSrc.length > 0) {
      // Caso URL
      const img = new window.Image();
      img.src = imageSrc;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        // Aquí cambia el tamaño del canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Y ahora llamamos a renderOverlay, que leerá el nuevo tamaño
        renderOverlay();
      };
    }
  }, [imageSrc, shapValues, segmentationMap, opacity]);

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-2 text-center">
        {title && (
          <h6 className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
            {title}
          </h6>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: '300px',
              height: 'auto',
              borderRadius: '6px',
              border: '1px solid #eee',
            }}
          />
        </div>
        <div
          className="d-flex justify-content-center gap-3 mt-2"
          style={{ fontSize: '0.75rem', color: '#666' }}
        >
          <div className="d-flex align-items-center">
            <span
              style={{
                width: 10,
                height: 10,
                background: 'rgba(255,0,0,0.6)',
                marginRight: 5,
                borderRadius: 2,
              }}
            ></span>{' '}
            + Importancia
          </div>
          <div className="d-flex align-items-center">
            <span
              style={{
                width: 10,
                height: 10,
                background: 'rgba(0,0,255,0.6)',
                marginRight: 5,
                borderRadius: 2,
              }}
            ></span>{' '}
            - Importancia
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
