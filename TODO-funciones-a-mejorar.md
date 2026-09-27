# TODO — Funciones con efectos secundarios a mejorar

Funciones que modifican sus parámetros, el estado previo de React o constantes del módulo, o
que tienen efectos ocultos (DOM, canvas, estado global). No todas son errores hoy, pero
hacen el código difícil de entender y provocan fallos sutiles: por ejemplo, una ImageData que
cambia al volver a clasificarla o una configuración "por defecto" que deja de serlo.

**Criterio para corregirlas:** una función recibe datos y devuelve datos nuevos; si
tiene que escribir en un canvas o en el DOM, que su nombre y su firma lo digan
(`draw…`, `render…`, parámetro de salida explícito). Con `setState(prev => …)`, copiar
también los objetos anidados que se modifican (o usar `structuredClone`).

Prioridad: 🔴 provoca errores · 🟠 riesgo alto · 🟡 claridad/mantenibilidad

## Estado de React y constantes mutadas

- [x] 🔴 **`DataFramePlotContext`** — [DataFramePlotContext.tsx:36](src/components/_context/DataFramePlotContext.tsx#L36)
  `useState(DEFAULT_DATAFRAME_PLOT_CONFIG)` usa la constante del módulo como estado. Como los
  manejadores de abajo modifican objetos anidados, **se modifica la constante**: el "Reset"
  deja de restaurar los valores por defecto y el cambio se comparte entre instancias.
  → `useState(() => structuredClone(DEFAULT_DATAFRAME_PLOT_CONFIG))`.
- [x] 🔴 **`handleClick_reset`** — [DataFramePlotModalConfiguration.tsx:70](src/components/dataframe/DataFramePlotModalConfiguration.tsx#L70)
  `{ ...DEFAULT_DATAFRAME_PLOT_CONFIG }` es una copia superficial y después escribe
  `resetState.TIME_SERIES_PLOTS.config.index = …` → modifica la constante.
- [x] 🔴 **`handleChange_PlotConfig_LAYOUT` / `_PieCharts` / `_TimeSeries` / `_Scatter`** — [DataFramePlotModalConfiguration.tsx:82-121](src/components/dataframe/DataFramePlotModalConfiguration.tsx#L82-L121)
  `Object.assign({}, prevState)` copia solo el primer nivel; `_prevState.LAYOUT[key] = …` y
  `_prevState.X.config[key] = …` modifican el estado anterior. React puede no detectar el
  cambio en los componentes memorizados.
  → `{ ...prev, LAYOUT: { ...prev.LAYOUT, [key]: value } }`.
- [x] 🟠 **`handleChange_PlotConfig_TimeSeries`** — [DataFramePlotModalConfiguration.tsx:98](src/components/dataframe/DataFramePlotModalConfiguration.tsx#L98)
  Calcula `newColumns` y no lo usa (`// TODO FIX`): la columna índice no se quita de `COLUMNS`.
- [x] 🔴 **`useEffect` que inicializa la configuración de gráficos** — [DataFramePlot.tsx:104](src/components/dataframe/DataFramePlot.tsx#L104)
  Mismo patrón: copia superficial y escritura en `TIME_SERIES_PLOTS.config` y `PIE_CHARTS.config`.
- [x] 🔴 **`handlerClick_RemoveLayer`** — [RegressionEditorLayers.tsx:76](src/pages/playground/1_Regression/RegressionEditorLayers.tsx#L76)
  `params.params_layers.splice(index, 1)` modifica el estado actual fuera de `setParams` y
  luego pasa el mismo array: React puede no volver a renderizar.
  → `params_layers: prev.params_layers.filter((_, i) => i !== index)`.
- [x] 🔴 **`handleChange_Layer`** — [RegressionEditorLayers.tsx:89](src/pages/playground/1_Regression/RegressionEditorLayers.tsx#L89)
  `prevState.params_layers[index] = value` modifica el estado anterior.
  → `params_layers: prev.params_layers.map((l, i) => (i === index ? value : l))`.

## Imagen y canvas

- [x] 🔴 **`handleCanvasDraw_Submit`** — [ModelReviewImageClassificationMNIST.tsx:31](src/pages/playground/3_ImageClassification/ModelReviewImageClassificationMNIST.tsx#L31)
  Dibuja el trazo a tamaño completo en `#originalImage` y encima una miniatura 28×28 en (10,10),
  y después lee esa zona: la miniatura se mezcla con el dibujo grande que hay debajo, así que
  el modelo recibe una imagen contaminada. Además busca el canvas con `document.getElementById`.
  → Reducir a 28×28 en un canvas propio (como `resample_single`) y pasar la `ImageData` resultante.
- [x] 🟠 **`MODEL_IMAGE_MNIST.GET_IMAGE_DATA`** — [MODEL_IMAGE_MNIST.tsx:137](src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_MNIST.tsx#L137)
  Un "get" que **dibuja** una miniatura sobre el canvas que recibe (visible para el usuario) y
  lee de él. → Dibujar en un canvas auxiliar fuera del DOM y devolver su `ImageData`.
- [x] 🟡 **`MODEL_IMAGE_MOBILENET.GET_IMAGE_DATA`** — [MODEL_IMAGE_MOBILENET.tsx:74](src/pages/playground/3_ImageClassification/models/MODEL_IMAGE_MOBILENET.tsx#L74)
  Redibuja el canvas sobre sí mismo antes de leerlo; el efecto es innecesario y confuso.
- [x] 🟠 **`UTILS_image.drawImageInCanvasWithContainer`** — [utils.ts:3](src/pages/playground/3_ImageClassification/utils/utils.ts#L3)
  Modifica `image.width` / `image.height` del `<img>` recibido y busca el canvas por id en el
  DOM global. → Recibir el canvas (o su ref) y calcular el tamaño sin tocar la imagen.
- [x] 🟡 **`resample_single`** → funciones puras en [utils.ts](src/pages/playground/3_ImageClassification/utils/utils.ts):
  `resampleImageData`, `thresholdImageData` e `imageDataToMnistTensor4d` (preprocesado MNIST único). La vista
  previa la pinta quien llama. Corregidos de paso un `NaN` en zonas transparentes y la predicción de
  imágenes subidas en entrenamiento (usaba solo el alfa, que en una imagen opaca siempre vale 255).

## Explicabilidad

- [x] 🟡 **`objectDetectionWrapper`** — [ObjectDetectionWrapper.ts:35](src/core/explainability/ObjectDetectionWrapper.ts#L35)
  Recibe `debugImages: string[]` y le hace `push` (parámetro de salida oculto dentro de un
  predictor que llama KernelSHAP). → Devolver la galería junto al predictor
  (`{ predict, debugImages }`) o recibir un callback `onSample`.
- [x] 🟡 **Singleton de FaceMesh** — [runObjectDetectionExplain.ts:32](src/pages/playground/2_ObjectDetection/explainPrediction/runObjectDetectionExplain.ts#L32)
  Estado de módulo (`let faceMeshInstance`) que nunca se libera, y un segundo FaceMesh aunque el
  modelo seleccionado ya sea FaceMesh. → Reutilizar el modelo activo si es FaceMesh y exponer `dispose`.
- [x] 🟡 **`getSelectedLabelsFromDetections`** (runObjectDetectionExplain.ts) decidía fuera del modelo, con
  comprobaciones por tipo de detección, qué etiquetas explicar; con FACE-DETECTOR no encontraba ninguna y la
  explicación salía vacía. → Cada modelo declara `EXPLAIN_LABELS`, `NORMALIZE_PREDICTIONS`,
  `EXPLAIN_PREDICTION_CONFIG` y `EXPLAIN_LABEL_TEXT` en [_model.tsx](src/pages/playground/2_ObjectDetection/models/_model.tsx).
- [x] 🟡 **`NORMALIZE_PREDICTIONS` con longitud incorrecta** — [ObjectDetectionWrapper.ts](src/core/explainability/ObjectDetectionWrapper.ts)
  se sustituía en silencio por ceros (SHAP todo 0 sin avisar). → Error explícito.
- [x] 🟡 **`_ImageData_To_Image`** (clase base de detección) creaba un `<img>` desde un dataURL en cada
  perturbación de SHAP. → Eliminado; FACE-API pinta la `ImageData` en un canvas de forma síncrona.

## Rendimiento relacionado (efectos en la carga)

- [x] 🟠 **`TASKS` / `UPLOAD`** vivían en `DATA_MODEL.ts`, que importa todas las clases de modelos
  (~1,4 MB). Movidos a [src/TASKS.ts](src/TASKS.ts): la home y el playground ya no cargan los modelos
  de las demás tareas.
- [x] 🟠 **`src/core/types.ts`** importaba `danfojs`, `@tensorflow/tfjs` y las clases base como
  valores (no `import type`): cualquier módulo que usara los tipos arrastraba TF.js y danfojs.
- [x] 🟡 **`DATA_MODEL.ts`** ya no importa ninguna clase: las claves están en [MODEL_KEYS.ts](src/MODEL_KEYS.ts), cada
  tarea tiene un registro de `import()` ([modelRegistry.ts](src/core/models/modelRegistry.ts)) y los menús cargan
  solo el modelo seleccionado ([useMenuModel.ts](src/hooks/useMenuModel.ts)). Cada modelo es un chunk propio.
- [x] 🟠 **danfojs trae su propia copia de TensorFlow.js** → alias a su código sin empaquetar
  (`dist/danfojs-browser/src`) + `overrides` de pnpm a TF.js 4.22. `danfojs-base` no es una opción: se
  publicó en npm en 2023 y se retiró (no tiene versiones instalables).
- [x] 🟡 **plotly duplicado**: danfojs usa `plotly.js-dist-min` 2.8 (~3,7 MB) y los gráficos propios
  `react-plotly.js` con `plotly.js` 3.6 (~4,7 MB). → [Plot.ts](src/components/dataframe/Plot.ts) crea `<Plot>` con
  `react-plotly.js/factory` y el mismo `plotly.js-dist-min` 2.8 (comprobado: tablas de danfojs y dispersión en AUTO_MPG).
- [x] 🟡 **scikitjs** solo se usaba para `trainTestSplit` y arrastraba `mathjs@10` completo (`create(all)`).
  → [trainTestSplit.ts](src/utils/trainTestSplit.ts), función pura con semilla opcional.
- [x] 🟡 **mathjs triplicado** (9 de danfojs, 10 de scikitjs, 11 nuestro) → una sola copia (`overrides` en `pnpm-workspace.yaml`).
- [x] 🟡 `src/core/nn-review-models/data/*.json` no se usaba en ningún sitio → eliminado (9,5 MB).
