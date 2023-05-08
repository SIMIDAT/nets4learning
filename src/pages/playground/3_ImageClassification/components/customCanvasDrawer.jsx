import React, { useEffect, useRef, useState } from 'react'
import { Button } from "react-bootstrap"
import './customCanvasDrawer.css'
import { Trans } from "react-i18next";

export default function CustomCanvasDrawer(props) {
  const { submitFunction, clearFunction } = props
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef(null)
  const contextRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = 600
    canvas.height = 600
    canvas.style.width = '200px'
    canvas.style.heigt = '200px'

    const context = canvas.getContext('2d')
    context.scale(3, 3)
    context.lineCap = 'round'
    context.strokeStyle = 'black'
    context.lineWidth = 20
    contextRef.current = context

    // React to touch events on the canvas
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove)

    return () => {
      canvas.removeEventListener("touchstart", null)
      canvas.removeEventListener("touchmove", null)
    }
  }, [])


  const startDrawing = ($event) => {
    const { nativeEvent } = $event
    const { offsetX, offsetY } = nativeEvent
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const finishDrawing = () => {
    contextRef.current.closePath()
    setIsDrawing(false)
  }

  const draw = ($event) => {
    const { nativeEvent } = $event
    if (isDrawing) {
      const { offsetX, offsetY } = nativeEvent
      contextRef.current.lineTo(offsetX, offsetY)
      contextRef.current.stroke()
    }
  }

  const clear = () => {
    contextRef.current.clearRect(0, 0, 200, 200)
  }

  function handleTouchStart(e) {
    e.preventDefault()
  }

  function handleTouchMove(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const cssX = e.touches[0].clientX - rect.left
    const cssY = e.touches[0].clientY - rect.top
    //* canvasRef.current.width  / rect.width
    //* canvasRef.current.height / rect.height
    // contextRef.current.fillStyle = `hsl(${performance.now() % 360 | 0},100%,50%)`
    contextRef.current.fillRect(cssX - 20, cssY - 20, 20, 20)
  }

  return (
    <>
      <div className={"d-flex justify-content-center"}>
        <canvas id='drawCanvas'
                style={{
                  border: '1px solid black'
                }}
                ref={canvasRef}
                onMouseDown={(event) => startDrawing(event)}
                onMouseUp={(event) => finishDrawing(event)}
                onMouseMove={(event) => draw(event)}
                onChange={(event) => startDrawing(event)}></canvas>

      </div>
      <div className="d-flex gap-2 justify-content-center mx-auto mt-3">
        <Button variant={"primary"}
                onClick={() => {
                  submitFunction(canvasRef.current, canvasRef.current.getContext("2d"))
                }}>
          <Trans i18nKey={"custom-canvas-drawer.validate"}/>
        </Button>
        <Button variant={"warning"}
                onClick={() => {
                  clear()
                  clearFunction()
                }}>
          <Trans i18nKey={"custom-canvas-drawer.clear"}/>
        </Button>
      </div>
    </>
  )
}
