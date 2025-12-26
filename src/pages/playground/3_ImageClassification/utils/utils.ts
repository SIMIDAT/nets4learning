export const UTILS_image = {
  failed                        : (event: Event) => console.error(event),
  drawImageInCanvasWithContainer: (image: HTMLImageElement, canvas_id: string) => {
    const canvas = document.getElementById(canvas_id) as HTMLCanvasElement
    const canvas_ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // const container_w = document.getElementById(container_canvas_id).getBoundingClientRect().width
    const original_ratio = image.width / image.height
    let designer_width = 200
    let designer_height = 200
    const designer_ratio = designer_width / designer_height
    if (original_ratio > designer_ratio) {
      designer_height = designer_width / original_ratio
    } else {
      designer_width = designer_height * original_ratio
    }
    image.width = designer_width
    image.height = designer_height
    // Dibujamos a tam original
    canvas.width = image.width
    canvas.height = image.height
    canvas_ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  },
}

export function resample_single(canvas: HTMLCanvasElement, width: number, height: number, resize_canvas: HTMLCanvasElement) {
  const width_source = canvas.width
  const height_source = canvas.height
  width = Math.round(width)
  height = Math.round(height)

  const ratio_w = width_source / width
  const ratio_h = height_source / height
  const ratio_w_half = Math.ceil(ratio_w / 2)
  const ratio_h_half = Math.ceil(ratio_h / 2)

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const ctx2 = resize_canvas.getContext('2d') as CanvasRenderingContext2D
  const img = ctx.getImageData(0, 0, width_source, height_source)
  const img2 = ctx2.createImageData(width, height)
  const data = img.data
  const data2 = img2.data

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x2 = (i + j * width) * 4
      let weight = 0
      let weights = 0
      let weights_alpha = 0
      let gx_r = 0
      let gx_g = 0
      let gx_b = 0
      let gx_a = 0
      const center_y = (j + 0.5) * ratio_h
      const yy_start = Math.floor(j * ratio_h)
      const yy_stop = Math.ceil((j + 1) * ratio_h)
      for (let yy = yy_start; yy < yy_stop; yy++) {
        const dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half
        const center_x = (i + 0.5) * ratio_w
        const w0 = dy * dy //pre-calc part of w
        const xx_start = Math.floor(i * ratio_w)
        const xx_stop = Math.ceil((i + 1) * ratio_w)
        for (let xx = xx_start; xx < xx_stop; xx++) {
          const dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half
          const w = Math.sqrt(w0 + dx * dx)
          if (w >= 1) {
            //pixel too far
            continue
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1
          const pos_x = 4 * (xx + yy * width_source)
          //alpha
          gx_a += weight * data[pos_x + 3]
          weights_alpha += weight
          //colors
          if (data[pos_x + 3] < 255) weight = (weight * data[pos_x + 3]) / 250
          gx_r += weight * data[pos_x]
          gx_g += weight * data[pos_x + 1]
          gx_b += weight * data[pos_x + 2]
          weights += weight
        }
      }
      data2[x2] = gx_r / weights
      data2[x2 + 1] = gx_g / weights
      data2[x2 + 2] = gx_b / weights
      data2[x2 + 3] = gx_a / weights_alpha
    }
  }

  // Ya que esta, exagerarlo. Blancos blancos y negros negros..?

  for (let p = 0; p < data2.length; p += 4) {
    let gris = data2[p] // Está en blanco y negro

    if (gris < 100) {
      gris = 0 //exagerarlo
    } else {
      gris = 255 //al infinito
    }

    data2[p] = gris
    data2[p + 1] = gris
    data2[p + 2] = gris
  }

  ctx2.putImageData(img2, 0, 0)
}
