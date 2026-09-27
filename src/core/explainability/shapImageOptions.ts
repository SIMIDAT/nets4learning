/** Parámetros de SHAP por segmentos de imagen. */
export type ShapImageOptions_t = {
  gridSide      : number
  nSamples      : number
  maskValue     : number
  blur          : boolean
  blurKernelSize: number
  blurPasses    : number
}

/**
 * Valores por defecto medidos con COCO-SSD (bulldog.jpg, curva de inserción): con 4 superpíxeles
 * por lado (~16 segmentos) KernelSHAP converge con ~100-300 muestras y la explicación es fiel
 * (los 3 segmentos con más SHAP bastan para mantener la detección). Con 6 por lado (~36
 * segmentos) harían falta muchas más muestras y el resultado era inestable.
 */
export const DEFAULT_SHAP_IMAGE_OPTIONS: ShapImageOptions_t = {
  gridSide      : 4,
  nSamples      : 150,
  maskValue     : 0.2,
  blur          : false,
  blurKernelSize: 15,
  blurPasses    : 2,
}
