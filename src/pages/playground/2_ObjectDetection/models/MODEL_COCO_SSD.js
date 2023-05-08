import { Trans } from "react-i18next";
import { MODEL_OBJECT_DETECTION } from "./_model";
import * as coCoSsdDetection from "@tensorflow-models/coco-ssd";

export class MODEL_COCO_SSD extends MODEL_OBJECT_DETECTION {
  TITLE = "datasets-models.2-object-detection.coco-ssd.title"
  static KEY = "COCO-SSD"
  static URL = ""
  static URL_MODEL = ""

  DESCRIPTION() {
    const prefix = "datasets-models.2-object-detection.coco-ssd.description."
    return <>
      <p><Trans i18nKey={prefix + "text-0"} /></p>
      <p>
        <Trans i18nKey={prefix + "text-1"}
               components={{
                 link1: <a href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd" target={"_blank"} rel={"noreferrer"}>TEXT</a>
               }} />
      </p>
      <p>
        <Trans i18nKey={prefix + "text-2"}
               components={{
                 link1: <a href="https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts" target={"_blank"} rel={"noreferrer"}>TEXT</a>
               }} />
      </p>
      <p><Trans i18nKey={prefix + "text-3"} /></p>
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
                     link1: <a href="https://cocodataset.org/" target={"_blank"} rel={"noreferrer"}>TEXT</a>
                   }} />
          </li>
        </ol>
      </details>
    </>
  }

  async enable_Model() {
    // const moveNetModelConfig = {}
    return await coCoSsdDetection.load()
  }

  render(ctx, predictions) {
    let score = 0;
    ctx.fillStyle = "#fc0400";
    ctx.font = "1em Verdana";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,255,21,0.84)";

    predictions.forEach((prediction) => {
      score = Math.round(parseFloat(prediction.score) * 100);
      ctx.strokeRect(prediction.bbox[0], prediction.bbox[1], prediction.bbox[2], prediction.bbox[3]);
      ctx.fillText(`${prediction.class.toUpperCase()} with ${score}% confidence`, prediction.bbox[0], prediction.bbox[1] + 20);
    });
  }
}