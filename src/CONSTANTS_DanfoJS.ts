import * as _Types from "@core/types"

export const TABLE_PLOT_STYLE_HEADER_STYLE = {
  align      : "center",
  fill       : { color: ["gray"] },
  font       : { family: "Arial", size: 15, color: "white" },
  columnwidth: 200,
}
export const TABLE_PLOT_STYLE_CELL_STYLE = {
  align: ["center"],
  line : { color: "black", width: 1 },
}

export const TABLE_PLOT_STYLE_CONFIG = {
  tableHeaderStyle: TABLE_PLOT_STYLE_HEADER_STYLE,
  tableCellStyle  : TABLE_PLOT_STYLE_CELL_STYLE,
}

export const TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1 = {
  ...TABLE_PLOT_STYLE_CONFIG,
  tableHeaderStyle: {
    ...TABLE_PLOT_STYLE_CONFIG.tableHeaderStyle,
    fill: { color: ["rgb(48,13,159)"] },
    font: { family: "Arial", size: 15, color: "white" },
  },
}

export const TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 = {
  ...TABLE_PLOT_STYLE_CONFIG,
  tableHeaderStyle: {
    ...TABLE_PLOT_STYLE_CONFIG.tableHeaderStyle,
    fill: { color: ["rgb(72,0,105)"] },
    font: { family: "Arial", size: 15, color: "white" },
  },
}
/**
 *
 * @param {string[]} columns
 * @param {_Types.DataFrameColumnTransformEnable_t[]} listColumnNameTransformations
 * @param {string} columnNameTarget
 * @returns
 */
export const F_TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 = (
  columns: string[],
  listColumnNameTransformations: _Types.DataFrameColumnTransformEnable_t[],
  columnNameTarget: string
) => {
  const array_color = columns.map((column_name) => {
    // Verificar si la columna es el target
    if (column_name === columnNameTarget) {
      return "rgb(255,0,105)"
    }

    // Buscar la transformación correspondiente a la columna
    const transformation = listColumnNameTransformations.find((trans) => trans.column_name === column_name)

    // Si no hay transformación o no está habilitada, devolver un color por defecto
    if (!transformation || !transformation.column_enable) {
      return "rgb(0,0,0)" // Color por defecto, puedes cambiarlo
    }

    // Devolver el color basado en column_transform
    switch (transformation.column_transform) {
      // "string" | "one-hot-encoder" | "label-encoder" | "int32" | "float32" | "replace_<match>_NaN" | "replace_?_NaN" | "drop_?" | "drop" | "dropNa" | "ignored"
      case "string": {
        // naranja
        return "rgb(255, 165, 0)"
      }
      case "one-hot-encoder": {
        // verde
        return "rgb(0, 128, 0)"
      }
      case "label-encoder": {
        // azul
        return "rgb(0, 0, 255)"
      }
      case "int32": {
        // índigo
        return "rgb(75, 0, 130)"
      }
      case "float32": {
        // violeta
        return "rgb(238, 130, 238)"
      }
      case "replace_<match>_NaN": {
        // rosa
        return "rgb(255, 192, 203)"
      }
      case "replace_?_NaN": {
        // rosa profundo
        return "rgb(255, 20, 147)"
      }
      case "drop_?": {
        // rojo anaranjado
        return "rgb(255, 69, 0)"
      }
      case "drop": {
        // rojo
        return "rgb(255, 0, 0)"
      }
      case "dropNa": {
        // rojo oscuro
        return "rgb(139, 0, 0)"
      }
      case "ignored": {
        // gris
        return "rgb(128, 128, 128)"
      }
      default: {
        // Color por defecto para transformaciones desconocidas
        return "rgb(0,0,0)"
      }
    }
  })

  return {
    ...TABLE_PLOT_STYLE_CONFIG,
    tableHeaderStyle: {
      ...TABLE_PLOT_STYLE_CONFIG.tableHeaderStyle,
      fill: { color: array_color },
      font: { family: "Arial", size: 15, color: "white" },
    },
  }
}

export const CONFIG_DANFOJS_FRAME = {
  frameConfig: {
    config: {
      tableMaxColInConsole: 20,
      tableMaxRow         : 40,
    },
  },
}
