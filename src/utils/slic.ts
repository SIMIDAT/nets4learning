/**
 * Javascript implementation of an image segmentation algorithm of
 *
 * SLIC Superpixels
 * Radhakrishna Achanta, Appu Shaji, Kevin Smith, Aurelien Lucchi, Pascal
 * Fua, and Sabine Süsstrunk
 * IEEE Transactions on Pattern Analysis and Machine Intelligence, vol. 34,
 * num. 11, p. 2274 - 2282, May 2012.
 *
 * and based on the VLFeat implementation.
 *
 * Originally written by LongLong Yu 2014.
 * Modified by Mingyu Kim
 * Modified by Jay Wang for WebSHAP
 * Adapted for TFJS pipeline integration
 */

export interface SLICOptions {
  regionSize?: number;
  minRegionSize?: number;
  maxIterations?: number;
}

export interface SLICMapResult {
  mapArray: Int32Array;
  numSegments: number;
}

// Función auxiliar para crear ImageData en el navegador
const createImageData = (width: number, height: number): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.style.visibility = 'hidden';
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No 2D context available');
  const imageData = context.createImageData(width, height);
  canvas.remove();
  return imageData;
};

class BaseSegmentation {
  imageData: ImageData;

  constructor(imageData: ImageData) {
    if (!(imageData instanceof ImageData)) throw new Error('Invalid ImageData');
    this.imageData = createImageData(imageData.width, imageData.height);
    this.imageData.data.set(imageData.data);
  }
}

export class SLIC extends BaseSegmentation {
  regionSize: number;
  minRegionSize: number;
  maxIterations: number;
  _numSegments: number;
  rawLabels: Int32Array | null; // Aquí guardaremos el array final para TFJS
  _result!: ImageData;

  constructor(imageData: ImageData, options?: SLICOptions) {
    super(imageData);
    options = options || {};
    this.regionSize = options.regionSize || 16;
    this.minRegionSize =
      options.minRegionSize || Math.round(this.regionSize * 0.8);
    this.maxIterations = options.maxIterations || 10;

    this._numSegments = 0;
    this.rawLabels = null;

    this._compute();
  }

  get result(): ImageData {
    return this._result;
  }

  get numSegments(): number {
    return this._numSegments;
  }

  _compute(): void {
    this._result = this.computeSLICSegmentation(
      this.imageData,
      this.regionSize,
      this.minRegionSize,
      this.maxIterations,
    );
  }

  // Convert RGBA into XYZ color space.
  rgb2xyz(rgba: Uint8ClampedArray, w: number, h: number): Float32Array {
    const xyz = new Float32Array(3 * w * h),
      gamma = 2.2;
    for (let i = 0; i < w * h; i++) {
      let r = rgba[4 * i + 0] * 0.00392156862,
        g = rgba[4 * i + 1] * 0.00392156862,
        b = rgba[4 * i + 2] * 0.00392156862;
      r = Math.pow(r, gamma);
      g = Math.pow(g, gamma);
      b = Math.pow(b, gamma);
      xyz[i] = r * 0.488718 + g * 0.31068 + b * 0.200602;
      xyz[i + w * h] = r * 0.176204 + g * 0.812985 + b * 0.0108109;
      xyz[i + 2 * w * h] = g * 0.0102048 + b * 0.989795;
    }
    return xyz;
  }

  // Convert XYZ to Lab.
  xyz2lab(xyz: Float32Array, w: number, h: number): Float32Array {
    function f(x: number): number {
      if (x > 0.00856) return Math.pow(x, 0.33333333);
      else return 7.78706891568 * x + 0.1379310336;
    }
    const xw = 1.0 / 3.0,
      yw = 1.0 / 3.0,
      Yw = 1.0,
      Xw = xw / yw,
      Zw = (1 - xw - yw) / (yw * Yw),
      ix = 1.0 / Xw,
      iy = 1.0 / Yw,
      iz = 1.0 / Zw,
      labData = new Float32Array(3 * w * h);
    for (let i = 0; i < w * h; i++) {
      const fx = f(xyz[i] * ix),
        fy = f(xyz[w * h + i] * iy),
        fz = f(xyz[2 * w * h + i] * iz);
      labData[i] = 116.0 * fy - 16.0;
      labData[i + w * h] = 500.0 * (fx - fy);
      labData[i + 2 * w * h] = 200.0 * (fy - fz);
    }
    return labData;
  }

  // Compute gradient.
  computeEdge(
    image: Float32Array,
    edgeMap: Float32Array,
    w: number,
    h: number,
  ): void {
    for (let k = 0; k < 3; k++) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const a = image[k * w * h + y * w + x - 1],
            b = image[k * w * h + y * w + x + 1],
            c = image[k * w * h + (y + 1) * w + x],
            d = image[k * w * h + (y - 1) * w + x];
          edgeMap[y * w + x] += Math.pow(a - b, 2) + Math.pow(c - d, 2);
        }
      }
    }
  }

  // Initialize superpixel clusters.
  initializeKmeansCenters(
    image: Float32Array,
    edgeMap: Float32Array,
    centers: Float32Array,
    clusterParams: Float32Array,
    numRegionsX: number,
    numRegionsY: number,
    regionSize: number,
    imW: number,
    imH: number,
  ): void {
    let i = 0,
      j = 0,
      x: number,
      y: number;
    for (let v = 0; v < numRegionsY; v++) {
      for (let u = 0; u < numRegionsX; u++) {
        let centerx = 0,
          centery = 0,
          minEdgeValue = Infinity;
        x = Math.floor(Math.round(regionSize * (u + 0.5)));
        y = Math.floor(Math.round(regionSize * (v + 0.5)));
        x = Math.max(Math.min(x, imW - 1), 0);
        y = Math.max(Math.min(y, imH - 1), 0);
        for (
          let yp = Math.max(0, y - 1);
          yp <= Math.min(imH - 1, y + 1);
          ++yp
        ) {
          for (
            let xp = Math.max(0, x - 1);
            xp <= Math.min(imW - 1, x + 1);
            ++xp
          ) {
            const thisEdgeValue = edgeMap[yp * imW + xp];
            if (thisEdgeValue < minEdgeValue) {
              minEdgeValue = thisEdgeValue;
              centerx = xp;
              centery = yp;
            }
          }
        }

        centers[i++] = centerx;
        centers[i++] = centery;
        centers[i++] = image[centery * imW + centerx];
        centers[i++] = image[imW * imH + centery * imW + centerx];
        centers[i++] = image[2 * imW * imH + centery * imW + centerx];
        clusterParams[j++] = 10 * 10;
        clusterParams[j++] = regionSize * regionSize;
      }
    }
  }

  computeCenters(
    image: Float32Array,
    segmentation: Int32Array,
    masses: number[],
    centers: Float32Array,
    numRegions: number,
    imW: number,
    imH: number,
  ): void {
    let region: number;
    for (let y = 0; y < imH; y++) {
      for (let x = 0; x < imW; x++) {
        region = segmentation[x + y * imW];
        masses[region]++;
        centers[region * 5 + 0] += x;
        centers[region * 5 + 1] += y;
        centers[region * 5 + 2] += image[y * imW + x];
        centers[region * 5 + 3] += image[imW * imH + y * imW + x];
        centers[region * 5 + 4] += image[2 * imW * imH + y * imW + x];
      }
    }
    for (region = 0; region < numRegions; region++) {
      const iMass = 1.0 / Math.max(masses[region], 1e-8);
      centers[region * 5] = centers[region * 5] * iMass;
      centers[region * 5 + 1] = centers[region * 5 + 1] * iMass;
      centers[region * 5 + 2] = centers[region * 5 + 2] * iMass;
      centers[region * 5 + 3] = centers[region * 5 + 3] * iMass;
      centers[region * 5 + 4] = centers[region * 5 + 4] * iMass;
    }
  }

  eliminateSmallRegions(
    segmentation: Int32Array,
    minRegionSize: number,
    numPixels: number,
    imW: number,
    imH: number,
  ): void {
    const cleaned = new Int32Array(numPixels),
      segment = new Int32Array(numPixels),
      dx = [1, -1, 0, 0],
      dy = [0, 0, 1, -1];
    let segmentSize: number,
      label: number,
      cleanedLabel: number,
      numExpanded: number,
      pixel: number,
      x: number,
      y: number,
      xp: number,
      yp: number,
      neighbor: number,
      direction: number;
    for (pixel = 0; pixel < numPixels; ++pixel) {
      if (cleaned[pixel]) continue;
      label = segmentation[pixel];
      numExpanded = 0;
      segmentSize = 0;
      segment[segmentSize++] = pixel;
      cleanedLabel = label + 1;
      cleaned[pixel] = label + 1;
      x = pixel % imW;
      y = Math.floor(pixel / imW);
      for (direction = 0; direction < 4; direction++) {
        xp = x + dx[direction];
        yp = y + dy[direction];
        neighbor = xp + yp * imW;
        if (0 <= xp && xp < imW && 0 <= yp && yp < imH && cleaned[neighbor])
          cleanedLabel = cleaned[neighbor];
      }
      while (numExpanded < segmentSize) {
        const open = segment[numExpanded++];
        x = open % imW;
        y = Math.floor(open / imW);
        for (direction = 0; direction < 4; ++direction) {
          xp = x + dx[direction];
          yp = y + dy[direction];
          neighbor = xp + yp * imW;
          if (
            0 <= xp &&
            xp < imW &&
            0 <= yp &&
            yp < imH &&
            cleaned[neighbor] === 0 &&
            segmentation[neighbor] === label
          ) {
            cleaned[neighbor] = label + 1;
            segment[segmentSize++] = neighbor;
          }
        }
      }
      if (segmentSize < minRegionSize) {
        while (segmentSize > 0) cleaned[segment[--segmentSize]] = cleanedLabel;
      }
    }
    for (pixel = 0; pixel < numPixels; ++pixel) --cleaned[pixel];
    for (let i = 0; i < numPixels; ++i) segmentation[i] = cleaned[i];
  }

  updateClusterParams(
    segmentation: Int32Array,
    mcMap: Float32Array,
    msMap: Float32Array,
    clusterParams: Float32Array,
  ): void {
    const mc = new Float32Array(clusterParams.length / 2),
      ms = new Float32Array(clusterParams.length / 2);
    for (let i = 0; i < segmentation.length; i++) {
      const region = segmentation[i];
      if (mc[region] < mcMap[region]) {
        mc[region] = mcMap[region];
        clusterParams[region * 2 + 0] = mcMap[region];
      }
      if (ms[region] < msMap[region]) {
        ms[region] = msMap[region];
        clusterParams[region * 2 + 1] = msMap[region];
      }
    }
  }

  assignSuperpixelLabel(
    im: Float32Array,
    segmentation: Int32Array,
    mcMap: Float32Array,
    msMap: Float32Array,
    distanceMap: Float32Array,
    centers: Float32Array,
    clusterParams: Float32Array,
    numRegionsX: number,
    numRegionsY: number,
    regionSize: number,
    imW: number,
    imH: number,
  ): void {
    let x: number, y: number;
    for (let i = 0; i < distanceMap.length; ++i) distanceMap[i] = Infinity;
    const S = regionSize;
    for (let region = 0; region < numRegionsX * numRegionsY; ++region) {
      const cx = Math.round(centers[region * 5 + 0]),
        cy = Math.round(centers[region * 5 + 1]);
      for (y = Math.max(0, cy - S); y < Math.min(imH, cy + S); ++y) {
        for (x = Math.max(0, cx - S); x < Math.min(imW, cx + S); ++x) {
          const spatial = (x - cx) * (x - cx) + (y - cy) * (y - cy),
            dR = im[y * imW + x] - centers[5 * region + 2],
            dG = im[imW * imH + y * imW + x] - centers[5 * region + 3],
            dB = im[2 * imW * imH + y * imW + x] - centers[5 * region + 4],
            appearance = dR * dR + dG * dG + dB * dB,
            distance = Math.sqrt(
              appearance / clusterParams[region * 2 + 0] +
                spatial / clusterParams[region * 2 + 1],
            );
          if (distance < distanceMap[y * imW + x]) {
            distanceMap[y * imW + x] = distance;
            segmentation[y * imW + x] = region;
          }
        }
      }
    }
    for (y = 0; y < imH; ++y) {
      for (x = 0; x < imW; ++x) {
        if (clusterParams[segmentation[y * imW + x] * 2] < mcMap[y * imW + x])
          clusterParams[segmentation[y * imW + x] * 2] = mcMap[y * imW + x];
        if (
          clusterParams[segmentation[y * imW + x] * 2 + 1] < msMap[y * imW + x]
        )
          clusterParams[segmentation[y * imW + x] * 2 + 1] = msMap[y * imW + x];
      }
    }
  }

  computeResidualError(
    prevCenters: Float32Array,
    currentCenters: Float32Array,
  ): number {
    let error = 0.0;
    for (let i = 0; i < prevCenters.length; ++i) {
      const d = prevCenters[i] - currentCenters[i];
      error += Math.sqrt(d * d);
    }
    return error;
  }

  remapLabels(segmentation: Int32Array): number {
    const map: Record<number, number> = {};
    let index = 0;
    for (let i = 0; i < segmentation.length; ++i) {
      const label = segmentation[i];
      if (map[label] === undefined) map[label] = index++;
      segmentation[i] = map[label];
    }
    return index;
  }

  encodeLabels(segmentation: Int32Array, data: Uint8ClampedArray): void {
    for (let i = 0; i < segmentation.length; ++i) {
      const value = Math.floor(segmentation[i]);
      data[4 * i + 0] = value & 255;
      data[4 * i + 1] = (value >>> 8) & 255;
      data[4 * i + 2] = (value >>> 16) & 255;
      data[4 * i + 3] = 255;
    }
  }

  computeSLICSegmentation(
    imageData: ImageData,
    regionSize: number,
    minRegionSize: number,
    maxIterations: number,
  ): ImageData {
    const imWidth = imageData.width,
      imHeight = imageData.height,
      numRegionsX = Math.floor(imWidth / regionSize),
      numRegionsY = Math.floor(imHeight / regionSize),
      numRegions = Math.floor(numRegionsX * numRegionsY),
      numPixels = Math.floor(imWidth * imHeight),
      edgeMap = new Float32Array(numPixels),
      masses: number[] = new Array(numPixels),
      currentCenters = new Float32Array((2 + 3) * numRegions),
      newCenters = new Float32Array((2 + 3) * numRegions),
      clusterParams = new Float32Array(2 * numRegions),
      mcMap = new Float32Array(numPixels),
      msMap = new Float32Array(numPixels),
      distanceMap = new Float32Array(numPixels),
      xyzData = this.rgb2xyz(imageData.data, imWidth, imHeight),
      labData = this.xyz2lab(xyzData, imWidth, imHeight);

    this.computeEdge(labData, edgeMap, imWidth, imHeight);

    this.initializeKmeansCenters(
      labData,
      edgeMap,
      currentCenters,
      clusterParams,
      numRegionsX,
      numRegionsY,
      regionSize,
      imWidth,
      imHeight,
    );

    const segmentation = new Int32Array(numPixels);

    for (let iter = 0; iter < maxIterations; ++iter) {
      this.assignSuperpixelLabel(
        labData,
        segmentation,
        mcMap,
        msMap,
        distanceMap,
        currentCenters,
        clusterParams,
        numRegionsX,
        numRegionsY,
        regionSize,
        imWidth,
        imHeight,
      );

      this.updateClusterParams(segmentation, mcMap, msMap, clusterParams);

      for (let i = 0; i < masses.length; ++i) masses[i] = 0;
      for (let i = 0; i < newCenters.length; ++i) newCenters[i] = 0;

      this.computeCenters(
        labData,
        segmentation,
        masses,
        newCenters,
        numRegions,
        imWidth,
        imHeight,
      );

      const error = this.computeResidualError(currentCenters, newCenters);
      if (error < 1e-5) break;

      for (let i = 0; i < currentCenters.length; ++i)
        currentCenters[i] = newCenters[i];
    }

    this.eliminateSmallRegions(
      segmentation,
      minRegionSize,
      numPixels,
      imWidth,
      imHeight,
    );

    // 1. Remapeamos para tener IDs secuenciales
    this._numSegments = this.remapLabels(segmentation);
    // 2. Guardamos el array raw para TFJS
    this.rawLabels = segmentation;

    // 3. Generamos la imagen visual
    const result = createImageData(imWidth, imHeight);
    this.encodeLabels(segmentation, result.data);

    return result;
  }
}

export const computeSLICMap = (
  imageData: ImageData,
  numSegmentsApprox = 15,
): SLICMapResult | null => {
  // Validar entrada
  if (!imageData || !imageData.width || !imageData.height) {
    console.error('SLIC Error: imageData inválido');
    return null;
  }

  const totalPixels = imageData.width * imageData.height;
  const computedRegionSize = Math.floor(
    Math.sqrt(totalPixels / numSegmentsApprox),
  );

  const options: SLICOptions = {
    regionSize: computedRegionSize || 30,
    minRegionSize: Math.round(computedRegionSize * 0.8),
    maxIterations: 10,
  };

  // Ejecutar
  const slicEngine = new SLIC(imageData, options);

  const mapArray = slicEngine.rawLabels;
  const numSegments = slicEngine.numSegments;

  if (!mapArray) return null;

  return {
    mapArray,
    numSegments,
  };
};
