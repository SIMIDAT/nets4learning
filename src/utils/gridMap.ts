/**
 * Resultado de la segmentación en rejilla: el mapa de IDs por píxel y el
 * número total de segmentos generados.
 */
export interface GridMapResult {
  mapArray: Int32Array;
  numSegments: number;
}

/**
 * Genera un mapa de segmentación basado en una rejilla cuadrada fija.
 * Divide la imagen en celdas de igual tamaño (ej: 8x8).
 *
 * @param width - Ancho de la imagen de trabajo (ej: 300)
 * @param height - Alto de la imagen de trabajo (ej: 300)
 * @param gridSize - Número de celdas por lado (ej: 8)
 * @returns El mapa de segmentos por píxel y el número de segmentos.
 */
export const computeGridMap = (
  width: number,
  height: number,
  gridSize: number,
): GridMapResult => {
  const totalPixels = width * height;

  // Array lineal que guardará el ID del segmento para cada píxel
  const mapArray = new Int32Array(totalPixels);
  const numSegments = gridSize * gridSize;

  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Ver dónde cae este píxel en la rejilla
      let col = Math.floor(x / cellWidth);
      let row = Math.floor(y / cellHeight);

      // Comprobación de límite para la última fila/columna
      col = Math.min(col, gridSize - 1);
      row = Math.min(row, gridSize - 1);

      // Fórmula para convertir coordenadas 2D a ID único 1D
      // ID = (Fila * AnchoGrid) + Columna
      const segmentId = row * gridSize + col;

      // Guardamos el ID en la posición lineal del píxel
      const pixelIndex = y * width + x;
      mapArray[pixelIndex] = segmentId;
    }
  }

  return { mapArray, numSegments };
};
