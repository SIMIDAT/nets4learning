/** Parámetros de SHAP por segmentos de imagen. */
export type ShapImageOptions_t = {
  gridSide      : number
  nSamples      : number
  maskValue     : number
  blur          : boolean
  blurKernelSize: number
  blurPasses    : number
}

export const DEFAULT_SHAP_IMAGE_OPTIONS: ShapImageOptions_t = {
  gridSide      : 6,
  nSamples      : 75,
  maskValue     : 0.2,
  blur          : false,
  blurKernelSize: 15,
  blurPasses    : 2,
}
