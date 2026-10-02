import "./customCanvasDrawer.css"
import { useEffect, useRef, type PointerEvent } from "react"
import { Button } from "react-bootstrap"
import { Trans } from "react-i18next"

// El dibujo va en coordenadas de 0 a 200 (el grosor del trazo, 20, es una décima parte del lienzo) sobre un lienzo de
// 600×600 píxeles, que se muestra con el tamaño que quepa en la pantalla
const DRAW_SIZE = 200
const CANVAS_PIXELS = 600

/**
 * @typedef {Object} CustomCanvasDrawerProps
 * @property {(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>} submitFunction
 * @property {() => void} clearFunction
 */
type CustomCanvasDrawerProps = {
  submitFunction: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>,
  clearFunction : () => void,
  onDrawStart  ?: () => void,
  /** Imagen de 28×28 que se pinta en el lienzo (p. ej. una del dataset); se puede seguir dibujando encima */
  image        ?: ImageData | null,
}

/**
 *
 * @param {CustomCanvasDrawerProps} props
 * @returns
 */
export default function CustomCanvasDrawer(props: CustomCanvasDrawerProps) {
  const {
    submitFunction,
    clearFunction,
    onDrawStart,
    image,
  } = props
  /**
   *
   * @type {React.MutableRefObject<null| HTMLCanvasElement>}
   */
  const canvas_ref = useRef<HTMLCanvasElement | null>(null)
  const context_ref = useRef<CanvasRenderingContext2D | null>(null)

  const canvas_small_ref = useRef<HTMLCanvasElement | null>(null)
  // Último punto del trazo que se está dibujando (null: no se está dibujando)
  const last_point_ref = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (canvas_ref.current === null) return
    const canvas = canvas_ref.current
    canvas.width = CANVAS_PIXELS
    canvas.height = CANVAS_PIXELS

    const context = canvas.getContext("2d") as CanvasRenderingContext2D
    // Se dibuja en coordenadas de 0 a DRAW_SIZE sea cual sea el tamaño en pantalla (setTransform y no scale: el
    // efecto puede repetirse, en StrictMode, y scale se acumularía)
    const scale = CANVAS_PIXELS / DRAW_SIZE
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = "black"
    context.lineWidth = 20
    context_ref.current = context
  }, [])

  // Imagen nueva: ampliada (sin suavizar, se ven los píxeles) en el lienzo y tal cual en la miniatura
  useEffect(() => {
    const context = context_ref.current
    const canvas_small = canvas_small_ref.current
    if (image === null || image === undefined || context === null || canvas_small === null) return
    canvas_small.getContext('2d')?.putImageData(image, 0, 0)
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    context.drawImage(canvas_small, 0, 0, context.canvas.width, context.canvas.height)
    context.restore()
  }, [image])

  /** Punto del puntero en las coordenadas del dibujo (el lienzo se muestra más o menos grande según la pantalla) */
  const drawPoint = (event: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = event.currentTarget
    const { offsetX, offsetY } = event.nativeEvent
    return [offsetX * DRAW_SIZE / canvas.clientWidth, offsetY * DRAW_SIZE / canvas.clientHeight]
  }

  // Ratón, dedo o lápiz: los eventos de puntero sirven para los tres
  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = context_ref.current
    if (context === null) {
      console.error("Context is null")
      return
    }
    if (event.pointerType === "mouse" && event.button !== 0) return
    event.preventDefault()
    // El trazo sigue aunque el dedo o el ratón salgan del lienzo
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = drawPoint(event)
    // Un toque sin moverse también deja un punto
    context.beginPath()
    context.moveTo(...point)
    context.lineTo(...point)
    context.stroke()
    last_point_ref.current = point
    // Al empezar a escribir un número nuevo, limpiamos el heatmap anterior.
    onDrawStart?.()
  }

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = context_ref.current
    const last_point = last_point_ref.current
    if (context === null || last_point === null) return
    const point = drawPoint(event)
    // Solo el tramo nuevo: volver a pintar todo el trazo en cada movimiento va cada vez más lento
    context.beginPath()
    context.moveTo(...last_point)
    context.lineTo(...point)
    context.stroke()
    last_point_ref.current = point
  }

  const finishDrawing = () => {
    last_point_ref.current = null
  }

  const clear = () => {
    if (context_ref.current === null) {
      console.error("Context is null")
      return
    }
    context_ref.current.clearRect(0, 0, DRAW_SIZE, DRAW_SIZE)
    const canvas_small = canvas_small_ref.current
    canvas_small?.getContext('2d')?.clearRect(0, 0, canvas_small.width, canvas_small.height)
  }

  return (
    <>
      <div className={"d-flex justify-content-center align-items-start gap-2 mt-3"}>
        <canvas
          id="canvas"
          ref={canvas_ref}
          className={"n4l-draw-canvas"}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
        ></canvas>
        <canvas
          id="canvas_small"
          ref={canvas_small_ref}
          style={{
            border        : "1px solid black",
            background    : "white",
            width         : "28px",
            height        : "28px",
            flex          : "none",
            imageRendering: "pixelated",
            boxSizing     : "border-box",
          }}
          width={28}
          height={28}
        ></canvas>
      </div>
      <div className="d-flex gap-2 justify-content-center mx-auto mt-3">
        <Button
          variant={"primary"}
          onClick={() => {
            const canvas = canvas_ref.current
            const canvas_small = canvas_small_ref.current
            if (canvas === null || canvas_small === null) {
              console.error("Canvas or small canvas is null")
              return
            }
            const context = context_ref.current as CanvasRenderingContext2D
            submitFunction(canvas, context, canvas_small)
          }}
        >
          <Trans i18nKey={"custom-canvas-drawer.validate"} />
        </Button>
        <Button
          variant={"outline-secondary"}
          onClick={() => {
            clear()
            clearFunction()
          }}
        >
          <Trans i18nKey={"custom-canvas-drawer.clear"} />
        </Button>
      </div>
    </>
  )
}
