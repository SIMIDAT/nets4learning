import { MODEL_IMAGE_CLASSIFICATION } from "./_model";
import { Trans } from "react-i18next";


export class MODEL_IMAGE_MNIST extends MODEL_IMAGE_CLASSIFICATION {
  static KEY = "IMAGE-MNIST"
  TITLE = "datasets-models.3-image-classifier.mnist.title"

  DESCRIPTION() {
    const prefix = "datasets-models.3-image-classifier.mnist.description."
    return <>
      <p><Trans i18nKey={prefix + "text-0"} /></p>
      <p><Trans i18nKey={prefix + "text-1"} /></p>
      <p><Trans i18nKey={prefix + "text-2"} /></p>

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
    </>
  }
}
