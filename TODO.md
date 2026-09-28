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
- [x] Japonés: añadidas las 252 claves que faltaban respecto a `en` (ahora `en` y `ja` tienen las mismas 1464 claves).
- [x] `pnpm-lock.yaml`: añadido el `integrity` de `xlsx` (CDN de SheetJS); `--frozen-lockfile` funciona con pnpm 10 y 12.
- [x] `.npmrc` eliminado (duplicaba `pnpm-workspace.yaml` y npm avisaba de opción desconocida).
- [x] `vite build`: el `manualChunks` metía todo `node_modules` en un único `vendor` de 20,2 MB que se descargaba en cualquier página. Ahora Rollup divide por rutas, `Playground.tsx` carga cada vista con `lazy()`, `TASKS`/`UPLOAD` salen de `DATA_MODEL` y `core/types.ts` usa `import type`: la entrada pesa ~0,9 MB y cada tarea descarga solo sus librerías.
- [x] Gráficos de recharts: `ResponsiveContainer` medía `-1×-1` en el primer render (aviso en consola) → prop `responsive` de recharts 3.
- [x] danfojs traía su propia copia de TensorFlow.js 3 (kernels registrados dos veces): ahora se usa su código sin empaquetar con nuestro TF.js 4.22 (alias en `vite.config.ts` + `overrides` en `pnpm-workspace.yaml`).
- [x] webshap también traía TF.js y mathjs empaquetados: su código fuente (MIT) está en `src/core/explainability/webshap/` y usa las dependencias del proyecto. Ya no aparece ningún "kernel … already registered".
- [x] pnpm 12: `"packageManager": "pnpm@12.6.0"` y `engines` en `package.json`; el CI (`pnpm/action-setup@v4`) toma la versión de ahí, instala con `--frozen-lockfile --production=false` y publica `dist/` (antes `build/`, que Vite no genera).

## 5. Explicabilidad correcta y comprensible (detalle en `docs/auditoria-explicabilidad.md`)
- [x] COCO-SSD: «Grid Side = 4» daba 6 zonas en vez de 16 (se pasaba el lado como nº de segmentos); ahora `gridSide²` en detección e imagen.
- [x] COCO-SSD: al explicar, umbral de puntuación 0,05 (con 0,5 la salida era un escalón 0/0,9 y SHAP apenas distinguía zonas).
- [x] FACE-DETECTOR: la explicación salía vacía; ahora explica «Cara» con el mapa de zonas faciales.
- [x] FACE-API: solo emociones con probabilidad ≥ 10 % (antes 6 de 8 etiquetas valían 0); fuera la edad (partía de 0 años: «la piel aporta +43,5 años»); import sin TF.js empaquetado.
- [x] HAND-SIGN: explica además la letra reconocida, no solo «hay mano».
- [x] HAND-SIGN: MediaPipe seguía la mano del fotograma anterior entre perturbaciones (SHAP no cuadraba: 0,984 vs 0,993); al explicar se reinicia el seguimiento (`resetTracking`). Eficiencia exacta, a costa de ~4× más tiempo.
- [x] API genérica en la clase base de detección (`EXPLAIN_LABELS`, `NORMALIZE_PREDICTIONS`, `EXPLAIN_PREDICTION_CONFIG`, `EXPLAIN_LABEL_TEXT`): cada modelo declara qué se explica y con qué nombre.
- [x] Imagen subida en detección dibujada en espejo: la página pasaba `flipHorizontal: !mirror` (`true` en MoveNet/COCO/FACE-API) y los detectores de MediaPipe no desactivan el espejo tras usar la webcam (fallo de `@tensorflow-models`). Imágenes y explicación siempre sin espejo + `syncMediaPipeMirror` en FACE-DETECTOR, FACE-MESH y HAND-SIGN.
- [x] `ObjectDetectionWrapper`: si `NORMALIZE_PREDICTIONS` devuelve otra longitud es un error visible (antes ceros en silencio → explicación en blanco).
- [x] `ExplainError` con clave de i18n: «no se ha detectado nada» en lugar del error genérico.
- [x] `ExplanationSummary`: ecuación `base + contribuciones = predicción` y lo que más empuja a favor/en contra, en imagen, detección, tabular y regresión.
- [x] Tabular/regresión: la explicación local muestra `variable = valor` con los valores del formulario (salvaguarda si no cuadran con las variables) y el objetivo por su nombre; aviso de valores normalizados en el beeswarm.
- [x] Nombres de zonas faciales, etiquetas «Cara/Pose/Mano/Signo», ayuda de las imágenes perturbadas, texto de LRP: 23 claves nuevas en `en`/`es`/`ja` (1487 en los tres).
- [x] SHAP de imagen por defecto: rejilla 4 (16 zonas), 150 muestras; `minShapSamples` garantiza al menos `2·zonas + 2`.

## 6. Verificado en navegador (ejecutando el código de la app con Edge sin interfaz)
- [x] Detección: COCO-SSD, FACE-DETECTOR, FACE-MESH, FACE-API, MoveNet, HAND-SIGN (eficiencia, inserción, localización).
- [x] Imagen: LRP de MNIST (10 dígitos) y SHAP de MobileNet.
- [x] Tabular (IRIS, CAR, LYMPHOGRAPHY) y regresión (AUTO_MPG, STUDENT_PERFORMANCE, WINE): eficiencia y acuerdo con la importancia por permutación.
- [x] Recorrido de la interfaz (automatizado con Edge sin interfaz, sin errores en consola):
  - Dibujar un «1» en MNIST → predicción «1» (100 %) y LRP sobre el trazo, con el texto de LRP y el consejo «¿se ha equivocado?».
  - Entrenar IRIS desde la pantalla de entrenamiento (con el nuevo `trainTestSplit`), predecir y explicar: «Setosa: 28,1 % + 52,5 % = 80,6 %», `petal_width = 0.2`.
  - Subir `car.csv` → procesar → entrenar → predecir → explicar: «unacc … Persons = 2, Safety = low» (categorías originales).
  - Cancelar el cálculo global a mitad (se queda con lo calculado) y beeswarm con el valor original en el tooltip (`acceleration = 16.4` en AUTO_MPG).
- [x] Contenido: clases de COCO traducidas, MoveNet por partes del cuerpo, notas de lectura por modelo, valores originales en el beeswarm (ver §4 de `docs/auditoria-explicabilidad.md`).
- [ ] Pendiente de contenido: nombres completos de LYMPHOGRAPHY (sin fuente fiable) y clases de ImageNet en inglés.

## 7. Logo, dependencias y limpieza
- [x] Favicon: `index.html` (el que usa Vite) apuntaba a `/vite.svg`, el logo por defecto de Vite. Ahora usa `favicon.ico` personalizado, `apple-touch-icon` (`logo192.png`), `manifest.json`, `theme-color`, descripción y título «Nets4Learning».
- [x] `manifest.json`: el favicon es de 256×256 (decía 64×64…16×16) y el nombre es «Nets4Learning».
- [x] Eliminados `public/index.html` (restos de Create React App, Vite no lo usa) y `public/vite.svg`.
- [x] `<html lang>` sigue al idioma activo de i18n (lectores de pantalla y traductor del navegador).
- [x] `scikitjs` eliminado: solo se usaba `trainTestSplit` y traía `mathjs@10` entero. Sustituido por [trainTestSplit.ts](src/utils/trainTestSplit.ts) (pura, con semilla opcional y tests).
- [x] danfojs traía `mathjs@9`: `overrides` a nuestro `mathjs@11` (solo usa `mean`, `median`, `mode`, `std` y `variance`; `describe()` coincide con el cálculo a mano). De tres copias de mathjs a una.
- [x] Tooltip del beeswarm: la línea salía repetida y con «: » delante (el `formatter` de recharts se llama por cada eje) → tooltip propio.
- [x] Etiquetas de imagen: «Class #leopard, Panthera pardus» → el nombre tal cual; los índices, «Clase 1».
- [x] Una sola copia de Plotly: nuestros gráficos usan el `plotly.js-dist-min` 2.8 de danfojs (`react-plotly.js/factory`) en vez de `plotly.js` 3.6.
- [x] Eliminado `src/core/nn-review-models/` (9,5 MB sin usar).
