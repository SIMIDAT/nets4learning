import { Trans, useTranslation } from "react-i18next"
import * as _Types from "@core/types"
import N4LEmptyState from "@components/loading/N4LEmptyState"
import N4LSummary from "@components/summary/N4LSummary"

type RegressionPredictionInfoProps = {
  prediction : _Types.StatePrediction_t
  /** Variable que predice el modelo */
  targetName?: string
  /** Valor real, si lo predicho es una instancia del conjunto de datos sin cambios */
  actual?    : number | null
}

/** Valor predicho y, si se conoce, el real y el error; debajo, la entrada en cada paso hasta el modelo */
export default function RegressionPredictionInfo({ prediction, targetName, actual = null }: RegressionPredictionInfoProps) {
  const prefix = "pages.playground.1-regression.predict."
  const { t, i18n } = useTranslation()
  const numberFormat = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 })
  const percentFormat = new Intl.NumberFormat(i18n.language, { style: "percent", maximumFractionDigits: 1 })

  if (prediction.result.length === 0) return <N4LEmptyState i18nKey={"pages.playground.generator.waiting-for-prediction"} />

  const [value] = prediction.result
  const error = actual === null ? null : value - actual
  const steps: Array<[string, string, unknown[] | undefined]> = [
    ["prediction-input", "prediction-input-description", prediction.input_1_dataframe_original.values[0] as unknown[]],
    ["prediction-input-encoding", "prediction-input-encoding-description", prediction.input_2_dataframe_encoding.values[0] as unknown[]],
    ["prediction-input-scaling", "prediction-input-scaling-description", prediction.input_3_dataframe_scaling.values[0] as unknown[]],
  ]
  const formatValue = (item: unknown) => (typeof item === "number" ? numberFormat.format(item) : String(item))

  return (
    <div data-testid={"Test-RegressionPredictionInfo"}>
      <div className={"d-flex flex-wrap align-items-baseline column-gap-3 row-gap-1"}>
        <span className={"text-body-secondary"}>
          {targetName ? t(prefix + "predicted-value", { target: targetName }) : t("prediction-result")}
        </span>
        <span className={"display-6"} data-testid={"Test-RegressionPrediction-value"}>{numberFormat.format(value)}</span>
        {actual !== null && error !== null && <>
          <span data-testid={"Test-RegressionPrediction-actual"}>
            {t(prefix + "actual-value", { value: numberFormat.format(actual) })}
          </span>
          <span className={"text-body-secondary"} data-testid={"Test-RegressionPrediction-error"}>
            {t(prefix + "error", {
              value  : (error > 0 ? "+" : "") + numberFormat.format(error),
              percent: actual === 0 ? "—" : percentFormat.format(Math.abs(error / actual)),
            })}
          </span>
        </>}
      </div>
      <div className={"mt-3"}>
        <N4LSummary title={<Trans i18nKey={prefix + "input-details"} />}>
          <dl className={"mb-0"}>
            {steps.map(([title, description, values]) => values && (
              <div key={title} className={"mb-2"}>
                <dt>
                  <Trans i18nKey={title} /> <small className={"fw-normal text-body-secondary"}><Trans i18nKey={description} /></small>
                </dt>
                <dd className={"mb-0 font-monospace small text-break"}>{values.map(formatValue).join(", ")}</dd>
              </div>
            ))}
          </dl>
        </N4LSummary>
      </div>
    </div>
  )
}
