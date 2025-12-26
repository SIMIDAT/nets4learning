import "./customCanvasDrawer.css"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Button } from "react-bootstrap"
import { Trans } from "react-i18next"

/**
 * @typedef {Object} CustomCanvasDrawerProps
 * @property {(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>} submitFunction
 * @property {() => void} clearFunction
 */
type CustomCanvasDrawerProps = {
  submitFunction: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, canvas_small: HTMLCanvasElement) => void | Promise<void>,
  clearFunction : () => void
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
  } = props
  const [isDrawing, setIsDrawing] = useState(false)
  /**
   *
   * @type {React.MutableRefObject<null| HTMLCanvasElement>}
   */
  const canvas_ref = useRef<HTMLCanvasElement | null>(null)
  const context_ref = useRef<CanvasRenderingContext2D | null>(null)

  const canvas_small_ref = useRef<HTMLCanvasElement | null>(null)

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault()
  }

  function handleTouchMove(e: TouchEvent) {
    if (canvas_ref.current === null || context_ref.current === null) {
      console.error("canvasRef or contextRef is null")
      return
    }

    const rect = canvas_ref.current.getBoundingClientRect()
    const cssX = e.touches[0].clientX - rect.left
    const cssY = e.touches[0].clientY - rect.top
    //* canvasRef.current.width  / rect.width
    //* canvasRef.current.height / rect.height
    // contextRef.current.fillStyle = `hsl(${performance.now() % 360 | 0},100%,50%)`
    context_ref.current.fillRect(cssX - 20, cssY - 20, 20, 20)
  }

  useEffect(() => {
    if (canvas_ref !== null) {
      const canvas = canvas_ref.current as HTMLCanvasElement
      canvas.width = 600
      canvas.height = 600
      canvas.style.width = "200px"
      canvas.style.height = "200px"

      const context = canvas.getContext("2d") as CanvasRenderingContext2D
      context.scale(3, 3)
      context.lineCap = "round"
      context.strokeStyle = "black"
      context.lineWidth = 20
      context_ref.current = context

      // React to touch events on the canvas
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
      canvas.addEventListener("touchmove", handleTouchMove)
      return () => {
        canvas.removeEventListener("touchstart", handleTouchStart)
        canvas.removeEventListener("touchmove", handleTouchMove)
      }
    }
  }, [])

  const startDrawing = (_event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (context_ref.current === null) {
      console.error("Context is null")
      return
    }
    const { nativeEvent } = _event
    const { offsetX, offsetY } = nativeEvent
    context_ref.current.beginPath()
    context_ref.current.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const finishDrawing = (_event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (context_ref.current === null) {
      console.error("Context is null")
      return
    }
    context_ref.current.closePath()
    setIsDrawing(false)
  }

  const draw = ($event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (context_ref.current === null) {
      console.error("Context is null")
      return
    }
    const { nativeEvent } = $event
    if (isDrawing) {
      const { offsetX, offsetY } = nativeEvent
      context_ref.current.lineTo(offsetX, offsetY)
      context_ref.current.stroke()
    }
  }

  const clear = () => {
    if (context_ref.current === null) {
      console.error("Context is null")
      return
    }
    context_ref.current.clearRect(0, 0, 200, 200)
  }

  const onChange = (event: FormEvent<HTMLCanvasElement>) => {
    console.log("onChange event:", event)
    event.preventDefault()
  }

  return (
    <>
      <div className={"d-flex justify-content-center mt-3"}>
        <canvas
          id="canvas"
          ref={canvas_ref}
          style={{
            border    : "1px solid black",
            background: "white",
          }}
          onMouseDown={(event) => startDrawing(event)}
          onMouseUp={(event) => finishDrawing(event)}
          onMouseMove={(event) => draw(event)}
          onChange={(event) => onChange(event)}
        ></canvas>
        <canvas
          id="canvas_small"
          ref={canvas_small_ref}
          style={{
            border        : "1px solid black",
            background    : "white",
            width         : "28px", 
            height        : "28px", 
            imageRendering: "pixelated",
            boxSizing     : "border-box"
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
          variant={"warning"}
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
