import { useEffect } from "react";

export function NeuralNetwork() {


  useEffect(() => {

    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width * 0.9;
    const height = canvas.height * 0.9;
    canvas.style.backgroundColor = "rgba(255, 255, 255, 1.0)";
    ctx.font = "15px Arial";


    let networkLayer = [6, 4, 2];
    let bias = true;

    let maxNeuronNumInLayer = Math.max.apply(Math, networkLayer);
    let neuronSize = height / maxNeuronNumInLayer;
    let radius = getRadiusSize(neuronSize);

    let intervalVertical = (height - maxNeuronNumInLayer * radius * 2) / maxNeuronNumInLayer;
    let interval = width / (networkLayer.length - 1) - radius;

    let x = radius + 10;
    let y = 0;
    let neuronLocationPerLayer = [];

    for (let numberIdx in networkLayer) {
      let thisLayerNeuronLocation = [];
      let number = networkLayer[numberIdx];
      console.log("x= " + x);
      y = (height - number * neuronSize) / 2 + radius + intervalVertical;

      for (let i = 0; i < number; ++i) {
        drawCircle(ctx, x, y, radius, 'white');
        if (bias === true) {
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          if (numberIdx !== networkLayer.length - 1) {
            if (i === 0)
              ctx.fillText("+1", x, y);
          }
        }
        thisLayerNeuronLocation.push([x, y]);
        y += (radius * 2 + intervalVertical);
      }
      neuronLocationPerLayer.push(thisLayerNeuronLocation);
      x += interval;
    }
    console.log(neuronLocationPerLayer);
    for (let i = 0; i < networkLayer.length - 1; i++) {
      let firstLayer = neuronLocationPerLayer[i];
      let secondLayer = neuronLocationPerLayer[i + 1];
      for (let firstIdx in firstLayer) {
        let firstX = firstLayer[firstIdx][0];
        let firstY = firstLayer[firstIdx][1];
        for (let secondIdx in secondLayer) {
          let secondX = secondLayer[secondIdx][0];
          let secondY = secondLayer[secondIdx][1];
          if (bias === true) {
            if (secondIdx === 0 && (i + 1) !== networkLayer.length - 1) {
              console.log(secondIdx)
              continue;
            } else
              drawLineArrow(ctx, firstX + radius, firstY, secondX - radius, secondY);
          } else {
            drawLineArrow(ctx, firstX + radius, firstY, secondX - radius, secondY);
          }
        }
      }
    }
  })

  function getRadiusSize(neuronSize) {
    return neuronSize / 2.5;
  }

  function drawCircle(context, centerX, centerY, radius, color, txt) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = radius / 20;
    context.strokeStyle = '#000000';
    context.stroke();
  }

  const arrow = [
    [2, 0],
    [-10, -4],
    [-10, 4]
  ];

  function drawFilledPolygon(ctx, shape) {
    ctx.beginPath();
    ctx.moveTo(shape[0][0], shape[0][1]);

    for (let p in shape)
      if (p > 0) ctx.lineTo(shape[p][0], shape[p][1]);

    ctx.lineTo(shape[0][0], shape[0][1]);
    ctx.fillStyle = "#000000";
    ctx.fill();
  }

  function translateShape(shape, x, y) {
    let rv = [];
    for (let p in shape)
      rv.push([shape[p][0] + x, shape[p][1] + y]);
    return rv;
  }

  function rotateShape(shape, ang) {
    let rv = [];
    for (let p in shape)
      rv.push(rotatePoint(ang, shape[p][0], shape[p][1]));
    return rv;
  }

  function rotatePoint(ang, x, y) {
    return [
      (x * Math.cos(ang)) - (y * Math.sin(ang)),
      (x * Math.sin(ang)) + (y * Math.cos(ang))
    ];
  }

  function drawLineArrow(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#000000";
    ctx.stroke();
    let ang = Math.atan2(y2 - y1, x2 - x1);
    drawFilledPolygon(ctx, translateShape(rotateShape(arrow, ang), x2, y2));
  }


  return <>
    <canvas id="myCanvas" width="800" height="500"></canvas>
  </>
}