# TODO — Revisión de la PR #1 (explicabilidad SHAP + LRP en v3)

Checklist de correcciones detectadas al revisar la PR, ordenadas por prioridad.

| Comprobación | Antes | Ahora |
|---|---|---|
| `tsc -b` | ✅ | ✅ |
| `vitest` | ✅ 13 pasan (los 11 fallos ya existían en `main`) | ✅ 25 pasan (+12 tests nuevos de LRP, segmentación facial y muestreo); los mismos 11 fallos previos |
| `eslint` (ficheros de la PR) | ❌ ~40 errores nuevos de `react-hooks/refs` + 214 de estilo | ✅ ningún error nuevo respecto a `main` |
| `pnpm install --frozen-lockfile` | ❌ con pnpm 10/11/12 | ✅ con pnpm 10 (CI) y 12 |
| `vite build` | — | ✅ (ver aviso de tamaño en §4) |

## 1. Errores de corrección (bloqueantes)

### LRP (`3_ImageClassification/explainPrediction/modelEmbeddingActivations.ts`)
- [x] `applyLRP` con `rule === 'alpha_beta'` en capas `Dense` llamaba a `lrpDense` (épsilon); `lrpDenseAlphaBeta` nunca se usaba.
- [x] Regla α-β con el signo mal: se sumaba `+β·(x·w⁻/z⁻)` cuando debe ser `α·(…)⁺ − β·(…)⁻`. Los valores por defecto de la función (α=0.5, β=0.5) no cumplían α−β=1.
- [x] Pooling (`upsampleRelevance`): `resizeBilinear / poolArea` no conservaba la relevancia, ignoraba `strides` y fallaba con padding `valid` en tamaños impares.
- [x] `winnerTakesAll` se pasaba desde el runner pero no se leía → MaxPooling ahora reparte la relevancia a la neurona ganadora (o proporcional si `false`).
- [x] Reglas reescritas con la formulación gradiente × entrada (`R_in = x ⊙ ∇ₓ(z · stopgrad(R/z))` con `tf.grad`), común a Dense, Conv2D, AvgPool y MaxPool.
- [x] Tests de LRP (`tests/explainability/lrp.test.ts`): conservación en Dense/Conv2D/AvgPool/MaxPool, α-β y despacho de `applyLRP`.

### Preprocesado MNIST (`models/MODEL_IMAGE_MNIST.tsx`)
- [x] `CLASSIFY_IMAGE` modificaba la `ImageData` que recibía (invertía colores): cada clic explicaba una imagen distinta.
- [x] LRP preprocesaba distinto que la predicción (canal rojo invertido vs canal alfa del dibujo). Ahora hay un único preprocesado `valor = (1 − rojo) · alfa`, que da exactamente lo mismo que antes para imágenes opacas y para el dibujo.
- [x] Pantalla de entrenamiento (`ImageClassification.tsx`): LRP explicaba una imagen distinta de la predicha (`GET_IMAGE_DATA` además pintaba una miniatura sobre el lienzo). Ahora usa la misma `ImageData` 28×28 que recibe el modelo.

### SHAP de imagen / detección
- [x] `ImageHeatMapChart`: si el mapa de segmentación no tenía el tamaño del canvas se pintaba una rejilla inventada. Ahora el mapa se escala por vecino más cercano (`segmentationWidth/Height`).
- [x] MoveNet: `NORMALIZE_PREDICTIONS` devolvía 17×nº de poses y el wrapper lo sustituía por ceros → SHAP siempre 0. Ahora salida escalar (confianza media de la mejor pose) + `GET_LABELS`.
- [x] FaceMesh: salida de longitud variable (una por cara). Ahora escalar + `GET_LABELS`.
- [x] Detección facial: `face.keypoints` lanzaba TypeError si FaceMesh no detectaba cara; ahora cae a SLIC0.
- [x] Detección sin nada detectado en la imagen base → se avisa en lugar de calcular una explicación sin sentido.
- [x] Clasificación de imagen: `blurKernelSize` y `blurPasses` no llegaban al wrapper (los controles no tenían efecto).

## 2. Rendimiento
- [x] Background de SHAP en imagen/detección: 20 filas de ceros idénticas → 20× inferencias. Ahora una sola fila (`buildMaskedBackground`).
- [x] SHAP tabular/regresión: background de 10 filas (antes 50, y 50 filas de ceros en el SHAP local de `ModelReviewRegression`), valores por defecto más bajos (500 muestras, 20 instancias en global), cede el hilo entre instancias y se puede cancelar.
- [x] Quitados los `console.log` de embeddings/activaciones y de los runners.
- [x] `toDataURL()` se calculaba en cada render y por cada clase del heatmap → se calcula una vez al terminar la explicación.

## 3. Mantenibilidad
- [x] Código muerto eliminado: `src/utils/slic.ts`, `src/utils/gridMap.ts`, `ImageClassificationWrapper.ts`, `GET_EMBEDDING_IMAGE` y su caché.
- [x] `myModelWrapper` devolvía `[]` en silencio con entradas de imagen → reescrito solo para tabular, con tipos y liberación de tensores en `finally`.
- [x] `3_ImageClassification/explainPrediction/runObjectDetectionExplain.ts` → `runImageClassificationExplain.ts`.
- [x] `ModelExplanationChart`: serie `pv` → «Valor SHAP», ordena por magnitud, no se cae si falta la clase, fuera `predictionProbs`.
- [x] `dataframeRowsToNumbers`: descarta filas con valores no numéricos en vez de propagar `NaN`.
- [x] `facialSegment`: rasterización propia sin antialiasing (antes mezclaba ids en los bordes). Test en `tests/explainability/facialSegment.test.ts`.
- [x] Explicabilidad tabular duplicada en 4 páginas → `TabularShapPanel`. Las páginas pasan de +360/+490 líneas a +15/+28 respecto a `main`.
- [x] Galería + heatmap + controles duplicados en imagen/detección → `ImageExplainPanel` (`ImageExplainResults`, `ShapImageControls`).
- [x] `eslint --fix` (estilo) y fuera los `eslint-disable` que sobraban.
- [x] Sin errores nuevos de `react-hooks/refs`: el resultado de la explicación vive en estado, no en refs leídas durante el render.

## 4. i18n, UI y configuración
- [x] Claves añadidas en `en`/`es`/`ja`: `ui.explain.{positive,negative,shap-value,error,model-not-available,lrp-not-available,cancel}` e `info.insert-input` (ya se usaba en `main` sin existir).
- [x] Sin textos fijos en español (alerta de LRP, título y leyenda del heatmap).
- [x] Etiquetas de FACE_API traducidas en los heatmaps.
- [x] Colores fijos (`#f9f9f9`, `#eee`, `#666`, `#ccc`) sustituidos por clases/variables de Bootstrap (tema oscuro).
- [x] Tabular: la explicación local usa por defecto la clase predicha y deja de mostrarse al hacer una nueva predicción.
- [x] Idioma japonés: código `jp` → `ja` (ISO 639-1).
- [ ] Japonés: faltan 252 claves respecto a `en` (se muestran en inglés por el `fallbackLng`). Valorar sacarlo a una PR aparte, no es explicabilidad.
- [x] `pnpm-lock.yaml`: añadido el `integrity` de `xlsx` (CDN de SheetJS); `--frozen-lockfile` funciona con pnpm 10 y 12.
- [x] `.npmrc` eliminado (duplicaba `pnpm-workspace.yaml` y npm avisaba de opción desconocida).
- [x] `vite build`: el `manualChunks` metía todo `node_modules` en un único `vendor` de 20,2 MB que se descargaba en cualquier página. Ahora Rollup divide por rutas, `Playground.tsx` carga cada vista con `lazy()`, `TASKS`/`UPLOAD` salen de `DATA_MODEL` y `core/types.ts` usa `import type`: la entrada pesa ~0,9 MB y cada tarea descarga solo sus librerías.
- [x] Gráficos de recharts: `ResponsiveContainer` medía `-1×-1` en el primer render (aviso en consola) → prop `responsive` de recharts 3.
- [ ] danfojs trae su propia copia de TensorFlow.js (~5,7 MB, kernels registrados dos veces). Ver `TODO-funciones-a-mejorar.md`.
- [ ] Alinear la versión de pnpm: `pnpm-workspace.yaml` usa opciones de pnpm ≥ 11 (`allowBuilds`, `blockExoticSubdeps`) y el CI fija `version: 10` (funciona, pero conviene fijar `packageManager` en `package.json`).

## 5. Pendiente de verificar en navegador
- [ ] Imagen: SHAP (MobileNet) y LRP (MNIST, subiendo imagen y dibujando), en revisión y en entrenamiento.
- [ ] Detección: COCO-SSD, FaceMesh, FACE_API, MoveNet.
- [ ] Tabular y regresión: local y global (barras y beeswarm), cancelar el cálculo global.
