import { Table } from "react-bootstrap"
import { Trans, useTranslation } from "react-i18next"

import { variableTables } from "@pages/datasets/datasetVariables"

/** Tabla de variables de un conjunto de datos, como la de su ficha en UCI */
export default function DatasetVariables({ files }: { files: string[] }) {
  const { t } = useTranslation()
  const tables = variableTables(files)

  // Los conjuntos de imágenes no tienen ficheros CSV
  if (tables.length === 0) {
    return <p className={"text-body-secondary mb-0"}><Trans i18nKey={"datasets.variables.images"} /></p>
  }

  return <>
    {tables.map((table) => (
      <section key={table.files[0]} className={"mb-3"}>
        {/* Con varios ficheros, cada tabla dice a cuáles corresponde */}
        {files.length > 1 && <h3 className={"h6"}>{table.files.map((file) => file.split("/").pop()).join(", ")}</h3>}
        <Table size={"sm"} striped responsive className={"align-middle mb-0"} data-testid={"Test-DatasetVariables"}>
          <thead>
            <tr>
              <th>{t("datasets.variables.name")}</th>
              <th>{t("datasets.variables.role")}</th>
              <th>{t("datasets.variables.type")}</th>
              <th>{t("datasets.variables.description")}</th>
              <th>{t("datasets.variables.units")}</th>
              <th className={"text-end text-nowrap"}>{t("datasets.variables.missing")}</th>
            </tr>
          </thead>
          <tbody>
            {table.variables.map((variable) => (
              <tr key={variable.name}>
                <td className={"font-monospace text-nowrap"}>{variable.name}</td>
                <td>{t("datasets.variables.roles." + variable.role)}</td>
                <td>{t("datasets.variables.types." + variable.type)}</td>
                <td>{variable.description}</td>
                <td className={"text-nowrap"}>{variable.units}</td>
                <td className={"text-end"}>{variable.missing}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    ))}
    <p className={"small text-body-secondary mb-0"}><Trans i18nKey={"datasets.variables.note"} /></p>
  </>
}
