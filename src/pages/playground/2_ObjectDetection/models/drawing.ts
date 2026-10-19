// Lo que dibujan los modelos de caras y de cuerpos (FaceDetector, FaceMesh, MoveNet): el recuadro de cada cara o
// persona, su etiqueta y el nombre de cada parte. Todo en píxeles del vídeo, multiplicado por `scale` para que se vea
// igual con cualquier resolución

export type Box_t = { xMin: number, yMin: number, xMax: number, yMax: number, width: number, height: number }

export const BOX_COLOR = '#4f46e5'
// Por debajo de este ancho (en un vídeo de 640 px) no caben los nombres de las partes: solo se dibujan las partes
export const NAMES_MIN_WIDTH = 120

/** La escala del dibujo: 1 en un vídeo de 640 px de ancho */
export const drawingScale = (ctx: CanvasRenderingContext2D) => Math.max(ctx.canvas.width, ctx.canvas.height) / 640

export const font = (size: number, scale: number, weight = 600) =>
  `${weight} ${size * scale}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius)
  else ctx.rect(x, y, width, height)
}

/** El recuadro: fino, con las esquinas gruesas (como el visor de una cámara) */
export function drawBox(ctx: CanvasRenderingContext2D, box: Box_t, scale: number, color = BOX_COLOR) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.6
  ctx.lineWidth = 2 * scale
  roundedRect(ctx, box.xMin, box.yMin, box.width, box.height, 10 * scale)
  ctx.stroke()
  ctx.globalAlpha = 1
  const corner = Math.min(box.width, box.height) * 0.22
  ctx.lineWidth = 5 * scale
  for (const [x, y, dx, dy] of [
    [box.xMin, box.yMin, 1, 1], [box.xMax, box.yMin, -1, 1], [box.xMin, box.yMax, 1, -1], [box.xMax, box.yMax, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * corner)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * corner, y)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * La etiqueta del recuadro («Cara», «Persona 2»…), con un detalle: encima o, si no cabe o tapa alguna de `avoid` (las
 * de otros recuadros), dentro, arriba, o debajo. Devuelve dónde ha quedado
 */
export function drawTag(
  ctx: CanvasRenderingContext2D,
  box: Box_t,
  text: string,
  detail: string | null,
  scale: number,
  color = BOX_COLOR,
  avoid: Rect_t[] = []
): Rect_t {
  ctx.save()
  ctx.font = font(14, scale)
  const textWidth = ctx.measureText(text).width
  ctx.font = font(12, scale)
  const detailWidth = detail === null ? 0 : ctx.measureText(detail).width + 8 * scale
  const width = textWidth + detailWidth + 20 * scale
  const height = 26 * scale
  const margin = 2 * scale
  const x = Math.min(Math.max(margin, box.xMin), ctx.canvas.width - width - margin)
  const candidates = [box.yMin - height - 6 * scale, box.yMin + 6 * scale, box.yMax + 6 * scale]
    .filter((top) => top >= margin && top + height <= ctx.canvas.height - margin)
    .map((top) => ({ left: x, top, width, height }))
  const { left, top: y } = candidates.find((rect) => !avoid.some((other) => overlaps(rect, other))) ??
    candidates[0] ?? { left: x, top: Math.max(margin, box.yMin + 6 * scale) }
  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)'
  ctx.shadowBlur = 6 * scale
  ctx.fillStyle = color
  roundedRect(ctx, left, y, width, height, 8 * scale)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = font(14, scale)
  ctx.fillText(text, left + 10 * scale, y + height / 2 + 0.5 * scale)
  if (detail !== null) {
    ctx.globalAlpha = 0.8
    ctx.font = font(12, scale)
    ctx.fillText(detail, left + 10 * scale + textWidth + 8 * scale, y + height / 2 + 0.5 * scale)
  }
  ctx.restore()
  return { left, top: y, width, height }
}

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export type Rect_t = { left: number, top: number, width: number, height: number }
export type Placement_t = { x: number, y: number, ux: number, uy: number, gap: number }

/**
 * Dónde va el nombre de una parte junto a su punto (x, y): hacia la dirección (ux, uy), a `gap` píxeles, para no tapar
 * la cara o el cuerpo, y siempre dentro del lienzo
 */
export function placePartName(ctx: CanvasRenderingContext2D, text: string, { x, y, ux, uy, gap }: Placement_t, scale: number): Rect_t {
  ctx.save()
  ctx.font = font(12, scale)
  const width = ctx.measureText(text).width + 22 * scale
  ctx.restore()
  const height = 20 * scale
  const margin = 2 * scale
  return {
    left: clamp(x + ux * gap + (ux < -0.3 ? -width : ux > 0.3 ? 0 : -width / 2), margin, ctx.canvas.width - width - margin),
    top : clamp(y + uy * gap + (uy > 0.3 ? 0 : uy < -0.3 ? -height : -height / 2), margin, ctx.canvas.height - height - margin),
    width,
    height,
  }
}

export const overlaps = (a: Rect_t, b: Rect_t) =>
  a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height

/** El nombre de una parte, en una etiqueta oscura con un punto de su color, donde lo coloca placePartName */
export function paintPartName(ctx: CanvasRenderingContext2D, text: string, color: string, { left, top, width, height }: Rect_t, scale: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
  roundedRect(ctx, left, top, width, height, height / 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(left + 8 * scale, top + height / 2, 3 * scale, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = font(12, scale)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, left + 14 * scale, top + height / 2 + 0.5 * scale)
  ctx.restore()
}

/** El nombre de una parte junto a su punto (placePartName) y pintado (paintPartName). Devuelve dónde ha quedado */
export function drawPartName(ctx: CanvasRenderingContext2D, text: string, color: string, placement: Placement_t, scale: number): Rect_t {
  const rect = placePartName(ctx, text, placement, scale)
  paintPartName(ctx, text, color, rect, scale)
  return rect
}

/**
 * El lado de la persona de una parte que MediaPipe llama «right» o «left». MediaPipe toma la imagen que procesa como
 * una foto normal: su derecha es la de la persona. Con la webcam en espejo procesa la imagen girada: el lado contrario
 */
export const personSide = (side: 'right' | 'left', mirrored: boolean): 'right' | 'left' =>
  mirrored === (side === 'right') ? 'left' : 'right'
