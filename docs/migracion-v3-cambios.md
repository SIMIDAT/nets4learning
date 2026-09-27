# Migración de la capa de explicabilidad a Nets4Learning v3.0.0 — registro de cambios

Documento de control de **todos** los cambios necesarios para portar la capa de
explicabilidad (SHAP + LRP), desarrollada sobre Nets4Learning **2.2.0**, a la
versión **3.0.0** de la plataforma. Rama de trabajo: `migracion-v3`.

## 1. Contexto

- El trabajo original se construyó sobre **v2.2.0** (Create React App + craco,
  **JavaScript**, React 18).
- La plataforma se reescribió en **v3.0.0**: **Vite** + **TypeScript estricto** +
  **React 19**, sin historia de git común con la versión anterior.
- Objetivo de la migración: trasladar la capa de explicabilidad **sin alterar
  ninguna mejora de v3**. Todos los cambios son **aditivos** (los borrados sobre
  ficheros de v3 son ≈ 0; ver §9).

## 2. Cambios de entorno y dependencias

| Cambio | Motivo |
|---|---|
| `pnpm-workspace.yaml` → `blockExoticSubdeps: false` | pnpm 11 bloquea por defecto dependencias resueltas por URL en subdependencias; `danfojs` depende de `xlsx` desde el CDN de SheetJS. |
| `pnpm-workspace.yaml` → `allowBuilds: { esbuild: true, … }` | pnpm 11 no ejecuta scripts de build por defecto; `esbuild` necesita el suyo para Vite. El resto se dejan en `false`. |
| `.npmrc` → `block-exotic-subdeps=false` | Equivalente para compatibilidad (la opción efectiva está en `pnpm-workspace.yaml`). |
| Dependencia **`webshap` (^0.1.4)** | Implementación de KernelSHAP ejecutable en el navegador. |
| Dependencia **`recharts` (^3.8.1)** | Gráfico de barras de importancia de características (`ModelExplanationChart`). |
| `pnpm-lock.yaml` regenerado | Consecuencia de añadir las dependencias anteriores. |

## 3. Cambios transversales (aplicados a TODO el código portado)

Estos cambios afectan a casi todas las líneas (de ahí el tamaño del diff) pero
**no modifican el comportamiento**:

- **JavaScript → TypeScript estricto.** El `tsconfig` de v3 activa `strict`,
  `noImplicitAny`, `noUnusedLocals` y `noUnusedParameters`, por lo que se han
  añadido anotaciones de tipo y eliminado código muerto (ver §8).
- **Alias de importación.** v3 usa `@core`, `@utils`, `@pages`, `@shared`
  (sin barra). Se sustituyó el alias antiguo `@/` por los de v3.

## 4. Ficheros nuevos (código de explicabilidad, sin equivalente en v3)

Portados ~1:1 desde `desarrollo`; solo cambian tipos y alias.

- **Utilidades:** `src/utils/gridMap.ts`, `slic.ts`, `slic0.ts`,
  `facialSegment.ts`.
- **Núcleo (`src/core/explainability/`):** `ImageClassificationWrapper.ts`,
  `ObjectDetectionWrapper.ts`, `ModelExplanation.ts`, `ImageHeatMapChart.tsx`,
  `ModelExplanationChart.tsx`, `adapters/createImageClassificationAdapter.ts`.
- **Orquestadores:**
  `3_ImageClassification/explainPrediction/runObjectDetectionExplain.ts`
  (SHAP + LRP), `2_ObjectDetection/explainPrediction/runObjectDetectionExplain.ts`,
  `3_ImageClassification/explainPrediction/modelEmbeddingActivations.ts`
  (reglas LRP: `lrpDense`, `lrpDenseAlphaBeta`, `lrpConv2D`, `lrpConv2DAlphaBeta`,
  `lrpMaxPooling2D`, `lrpAvgPooling2D`, `lrpFlatten`, `applyLRP`, y los helpers
  de embeddings/activaciones).

## 5. Modificaciones a modelos existentes de v3 (aditivas)

Métodos de soporte de explicabilidad que en v2.2.0 estaban añadidos a los
modelos y que v3 no incluía:

| Fichero | Añadido |
|---|---|
| `3_ImageClassification/models/MODEL_IMAGE_MNIST.tsx` | `_imageDataToMnistTensor4d` + `_embedActHelpers` + `GET_EMBEDDING_IMAGE`, `GET_ACTIVATIONS_IMAGE`, `CALCULATE_LRP_PROPAGATION` (LRP, solo MNIST). |
| `2_ObjectDetection/models/_model.tsx` (interfaz base) | Propiedades por defecto `usesTensorForPrediction`, `faces` y método `NORMALIZE_PREDICTIONS` por defecto (heredados por todos los modelos de detección). |
| `2_ObjectDetection/models/MODEL_4_COCO_SSD.tsx` | `NORMALIZE_PREDICTIONS`. |
| `2_ObjectDetection/models/MODEL_5_FACE_API.tsx` | `faces=true`, `usesTensorForPrediction=false`, `GET_LABELS`, `NORMALIZE_PREDICTIONS`. |
| `2_ObjectDetection/models/MODEL_2_FACE_MESH.tsx` | `faces=true`, `usesTensorForPrediction=true`, `NORMALIZE_PREDICTIONS`. |
| `2_ObjectDetection/models/MODEL_3_MOVE_NET_POSE_NET.tsx` | `usesTensorForPrediction=false`, `NORMALIZE_PREDICTIONS`. |

## 6. Modificaciones a las pantallas `ModelReview*` (UI, aditivas)

En cada pantalla se añadió: imports de explicabilidad, estado (refs y `useState`),
captura de la entrada a explicar, el manejador `handleRequest_ExplainPrediction`
y el panel de explicabilidad.

- `3_ImageClassification/ModelReviewImageClassification.tsx` — SHAP + LRP, mapa
  de calor (`ShapHeatmap`), controles de rejilla/nSamples/máscara/blur. La imagen
  base del mapa de calor usa el `toDataURL()` del canvas original a tamaño real
  (como en `desarrollo`), no la `ImageData` reducida: con MNIST (28×28) evita que
  el dígito salga borroso e ilegible bajo la relevancia.
- `3_ImageClassification/ModelReviewImageClassificationMNIST.tsx` (lienzo de
  dibujo) — añadido el callback `onImageDataReady`, que se invoca al
  dibujar+predecir para que el dígito dibujado quede disponible como entrada de
  la explicabilidad (antes solo funcionaba subiendo una imagen). Cableado en la
  pantalla IC. Reproduce el comportamiento de `desarrollo`.
- `2_ObjectDetection/ModelReviewObjectDetection.tsx` — SHAP, mapa de calor.
- `0_TabularClassification/ModelReviewTabularClassification.tsx` — SHAP,
  gráfico de importancia (`ShapExplanationChart`).
- `1_Regression/ModelReviewRegression.tsx` — SHAP, gráfico de importancia.

## 7. Internacionalización (i18n)

- `public/locales/es/translation.json` y `en/translation.json`: añadido el bloque
  `ui.explain` (title, perturbationSamples, gridSide, nSamples, mask, maskRange,
  calculating, explainPrediction, hideExplanation, noData, class) y `ui.blur`
  (enable, kernelSize, passes). El `en` original estaba incompleto (solo `blur`);
  se completó el bloque `explain` en inglés.
- `public/locales/jp/translation.json`: ya presente (idioma japonés, trabajo
  propio previo).

## 8. Desviaciones funcionales respecto a `desarrollo` (las únicas)

1. **`ObjectDetectionWrapper`**: eliminada la función `cosineSimilarity`
   (el propio código original la marcaba como no usada).
2. **`slic0` / `modelEmbeddingActivations`**: eliminadas variables
   desestructuradas y locales sin usar (p. ej. en `upsampleRelevance`), exigido
   por `noUnusedLocals`. Sin cambio de comportamiento.
3. **`ModelExplanationChart`**: la versión original usaba props inválidas de
   recharts (`responsive`, `width="auto"` sin `ResponsiveContainer`). Se corrigió
   al uso correcto con `ResponsiveContainer` para que compile y renderice.
4. **`ImageHeatMapChart`**: el tipo de `segmentationMap` se amplió para aceptar
   `Uint8Array` (segmentación facial). Aditivo.
5. **Runner de detección**: al instanciar `MODEL_2_FACE_MESH` internamente (solo
   para obtener keypoints) se le pasa una función de traducción identidad
   `((k) => k)`, porque el constructor de v3 exige el argumento `t`.

## 9. Lo que NO se ha modificado

- **Código de v3**: los borrados sobre ficheros existentes son ≈ 0 (solo líneas
  de `import` extendidas y un comentario reformateado). Ninguna mejora de v3 se
  ha eliminado.
- **Idioma japonés** (`public/locales/jp/translation.json`) y el selector de
  idioma del navbar (`src/components/header/N4LNavbar.tsx`): trabajo propio
  previo, ajeno a la explicabilidad.

## 10. Fidelidad de la UI respecto a `desarrollo`

Todas las pantallas se han alineado para reproducir fielmente el original:

- **Imagen** — selector de método (SHAP/LRP) en la cabecera, galería de
  perturbaciones, controles de rejilla/nSamples/máscara/blur, mensaje `noData`,
  y la imagen base del mapa de calor desde el canvas original (`toDataURL()`).
  Además, el lienzo de dibujo de MNIST/KMNIST notifica la imagen dibujada vía
  `onImageDataReady` para que sirva de entrada a la explicabilidad.
- **Detección** — galería, traducción de etiquetas de FACE_API, controles de
  rejilla/nSamples/máscara/blur, imagen base desde `canvasImage_ref.toDataURL()`.
- **Tabular** — selector de clase, nSamples con texto de ayuda, gráfico de
  importancia; claves `pages.playground.0-tabular-classification.general.*`.
- **Regresión** — nSamples con ayuda, `predictedClass=0`,
  `predictionProbs=prediction.result`; mismas claves de botón con `defaultValue`.

Claves i18n unificadas a las originales (`ui.explain.explainPrediction`,
`hideExplanation`, `maskRange`, `mask`, `noData`, `ui.blur.*`); se eliminaron las
claves provisionales `ui.explain.calculate`/`hide`.

### Pendiente
- **Verificación visual** en `pnpm dev`: Imagen (SHAP heatmap y LRP) verificada;
  Detección, Tabular y Regresión compilan (`tsc`) y quedan por comprobar en
  navegador con datos reales.
