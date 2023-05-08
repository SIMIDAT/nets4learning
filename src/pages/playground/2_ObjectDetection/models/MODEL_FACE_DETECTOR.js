import { MODEL_OBJECT_DETECTION } from "./_model";
import * as faceDetection from "@tensorflow-models/face-detection";
import { Trans } from "react-i18next";

export class MODEL_FACE_DETECTOR extends MODEL_OBJECT_DETECTION {
  TITLE = "datasets-models.2-object-detection.face-detection.title"
  static KEY = "FACE-DETECTOR"

  DESCRIPTION() {
    const prefix = "datasets-models.2-object-detection.face-detection.description."
    return <>
      <p><Trans i18nKey={prefix + "text-0"} /></p>
      <details>
        <summary><Trans i18nKey={prefix + "details-input.title"} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + "details-input.list.0"} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + "details-output.title"} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + "details-output.list.0"} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + "details-references.title"} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + "details-references.list.0"}
                   components={{
                     link1: <a href={"https://tfhub.dev/mediapipe/tfjs-model/facemesh/1/default/1"} target={"_blank"} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
    </>
  }


  async enable_Model() {
    const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
    const mediaPipeFaceDetectorMediaPipeModelConfig = {
      runtime     : "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection",
      modelType   : "short",
      maxFaces    : 4,
    };
    return await faceDetection.createDetector(model, mediaPipeFaceDetectorMediaPipeModelConfig)
  }

  render(ctx, faces) {
    ctx.font = "8px Verdana";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FF0902";
    // ctx.strokeRect(element.x, element.y, 5, 5)
    faces.forEach((face) => {
      face.keypoints.forEach((element) => {
        ctx.beginPath();
        ctx.arc(element.x, element.y, 2, 0, (Math.PI / 180) * 360);
        ctx.stroke();
        ctx.fillText(`${element.name}`, element.x, element.y);
      });
    });
  }

}