import type { TFunction } from "i18next"

export default class I_MODEL_OBJECT_DETECTION {
  TITLE         : string = ""
  i18n_TITLE    : string = ""
  _modelDetector: any | null = null
  mirror        : boolean = false
  t             : TFunction<"translation", undefined>

  constructor(_t: TFunction<"translation", undefined>) {
    this.t = _t
  }

  DESCRIPTION() {
    return <></>
  }

  async ENABLE_MODEL() {}

  /**
   *
   * @param {any} _input_image_or_video
   * @param {any} _config
   * @returns  {Promise<any[]>}
   */
  async PREDICTION(_input_image_or_video: any, _config: any): Promise<any[]> {
    return []
  }

  /**
   *
   * @param {CanvasRenderingContext2D} _ctx
   * @param {any} _predictions
   */
  RENDER(_ctx: CanvasRenderingContext2D, _predictions: any) {}

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  _drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.lineWidth = 3
    ctx.strokeStyle = "rgba(0,255,21,0.84)"
    ctx.strokeRect(x, y, w, h)
  }
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} txt
   * @param {string} font
   * @param {number} x
   * @param {number} y
   * @param {number} padding
   */
  _drawTextBG(ctx: CanvasRenderingContext2D, txt: string, font: string, x: number, y: number, padding: number) {
    ctx.font = font
    ctx.textBaseline = "top"
    ctx.fillStyle = "#fff"

    const width = ctx.measureText(txt).width
    ctx.fillRect(x, y, width + padding, parseInt(font, 10) + padding)

    ctx.lineWidth = 2
    ctx.strokeStyle = "#009ddf"
    ctx.strokeRect(x, y, width + padding, parseInt(font, 10) + padding)

    ctx.fillStyle = "#000000"
    ctx.fillText(txt, x + padding / 2, y + padding / 2)
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} txt
   * @param {string} font
   * @param {number} x
   * @param {number} y
   * @param {number} padding
   * @param {boolean} threshold
   */
  _drawTextBG_Opacity(
    ctx: CanvasRenderingContext2D,
    txt: string,
    font: string,
    x: number,
    y: number,
    padding: number,
    threshold: boolean
  ) {
    ctx.font = font
    ctx.textBaseline = "top"
    ctx.fillStyle = "#fff"

    const width = ctx.measureText(txt).width

    if (threshold) ctx.globalAlpha = 0.4
    ctx.fillRect(x, y, width + padding, parseInt(font, 10) + padding)
    if (threshold) ctx.globalAlpha = 1.0

    ctx.lineWidth = 2
    ctx.strokeStyle = "#009ddf"
    if (threshold) ctx.globalAlpha = 0.4
    ctx.strokeRect(x, y, width + padding, parseInt(font, 10) + padding)
    if (threshold) ctx.globalAlpha = 1.0

    ctx.fillStyle = "#000000"
    if (threshold) ctx.globalAlpha = 0.8
    ctx.fillText(txt, x + padding / 2, y + padding / 2)
    if (threshold) ctx.globalAlpha = 1.0
  }

  _drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) {
    ctx.beginPath()
    ctx.arc(x, y, r, 1, 3 * Math.PI)
    ctx.fill()
  }

  _ImageData_To_Image(imageData: ImageData) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    canvas.width = imageData.width
    canvas.height = imageData.height
    ctx.putImageData(imageData, 0, 0)

    const image = new Image()
    image.src = canvas.toDataURL()
    return image
  }
}
