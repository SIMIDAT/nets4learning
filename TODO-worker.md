# TODO — Cálculos pesados fuera del hilo principal (Web Workers)

Objetivo: que la interfaz no se congele mientras se procesan datos. Hoy todo (lectura y análisis de CSV, preprocesado,
decodificación de imágenes, TF.js, explicabilidad) corre en el hilo principal, y no hay ningún Web Worker en el
proyecto. Plan sacado de medir la aplicación (01/10/2026); cada fase se mide antes y después con el mismo guion.

Leyenda: `[x]` hecho · `[ ]` pendiente · `[~]` en curso o hecho a medias (ver nota) · `[-]` descartado.

---

## Diagnóstico (01/10/2026)

Medido en Chrome sin ventana contra el servidor de desarrollo, con un `PerformanceObserver` de tareas largas (más de
50 ms bloqueando el hilo principal). Los tiempos de TF.js son orientativos: sin ventana, WebGL va por SwiftShader
(software), más lento que con GPU.

| Escenario | Bloqueo total | Tarea más larga | Duración |
|---|---|---|---|
| /analyze: cargar California housing (20 640 × 14) | 2233 ms | **1981 ms** | 2,3 s |
| /analyze: cargar housing-price (1460 × 81) | 774 ms | 704 ms | 0,9 s |
| /analyze: cambiar el escalado del preprocesado (California) | 334 ms | 334 ms | 0,3 s |
| /analyze: cambiar la variable objetivo (housing-price) | 445 ms | 445 ms | 0,5 s |
| MNIST: cargar las imágenes de test (sprite) | 322 ms | 322 ms | 1,9 s |
| MNIST: clasificar el primer ejemplo | 321 ms | 321 ms | 0,4 s |
| MNIST: explicar con LRP | 693 ms | **693 ms** | 0,8 s |
| MobileNet: explicar con SHAP | 171 ms | 171 ms | 14 s |
| Car: entrenar (épocas de desarrollo) | 972 ms | 524 ms | 17 s |
| Car: SHAP global | 306 ms | 132 ms | 1,3 s |
| MNIST: cargar el conjunto y entrenar | 1872 ms | **841 ms** | 94 s |

Desglose de /analyze con California, cálculo a cálculo:

| Cálculo | Tiempo |
|---|---|
| `profileDataFrame` (perfil de las columnas) | **1517 ms** |
| … de ello, ordenar valores con `localeCompare(…, { numeric: true })` | 1330 ms (200 ms con un `Intl.Collator` compartido) |
| `preprocessDataFrame` | 79 ms |
| `describe()` de danfo | 59 ms |
| Leer el CSV (danfo/papaparse) | 56 ms |
| Tabla de Plotly con 20 640 filas | 35–51 ms |
| Dispersión (`scattergl`) / histograma de 20 640 puntos | 35 / 25 ms |
| `correlationMatrix` | 12 ms |

Conclusiones:

1. **Lo que más bloquea es el AED con CSV grandes**, y la mayor parte es un problema de algoritmo (un comparador que
   se crea en cada comparación), no de hilo: se arregla antes de mover nada (fase 0).
2. **Cálculo puro, sin DOM ni TF.js** (perfil, correlaciones, avisos, preprocesado, decodificar sprites): buenos
   candidatos para un worker, baratos de mover (fases 1 a 3).
3. **TF.js ya cede el control** entre lotes e instancias (entrenar dura 17–94 s con picos de 0,5–0,8 s; SHAP de
   MobileNet, 14 s con 171 ms de bloqueo). Los picos vienen de lecturas síncronas (`dataSync`/`arraySync`) y de
   preparar los datos. Moverlo a un worker es posible (modelo serializado con `tf.io`, WebGL con `OffscreenCanvas`)
   pero caro: se evalúa después (fases 4 y 5).
4. **Lo que no puede ir a un worker** (pintar con Plotly y React, el DOM, tfjs-vis, la cámara): cada gráfico cuesta
   poco, pero /analyze repinta unos diez a la vez al cambiar el objetivo. Ahí la solución es pintar menos (fase 6).

## Decisiones de arquitectura

- Workers de módulo con Vite: `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })` y
  `worker: { format: 'es' }` en `vite.config.ts`.
- Los workers de datos no importan danfo ni TF.js (cada worker que los importa carga otra copia de TF.js): reciben y
  devuelven columnas (`Float64Array` transferibles para las numéricas, arrays para el texto).
- Una función asíncrona por cálculo (p. ej. `profileInWorker(columns)`) con alternativa en el mismo hilo si no hay
  `Worker` (jsdom en los tests, navegadores antiguos): las funciones puras siguen probándose como hasta ahora.
- Cada petición lleva un id: si llega una respuesta vieja (el usuario ya cambió el formulario), se descarta.
- Cada fase se mide con el mismo guion y se anota en el registro.

---

## Fase 0 — Arreglos sin worker (rápidos y medidos)

- [x] **Guion de medida en el repositorio.** `Scripts/perf/longtasks.mjs`: Chrome sin ventana con un
      `PerformanceObserver` de tareas largas y los escenarios de la tabla del diagnóstico, para comparar antes y
      después de cada fase. Uso: `node Scripts/perf/longtasks.mjs http://localhost:5173/n4l [analyze|mnist|car|mnist-train]`.
      Clasificar, explicar y entrenar se miden dos veces (la primera compila los shaders de WebGL).
- [x] **`valueCounts` (`src/core/dataframe/eda.ts`).** Un `Intl.Collator` compartido (`naturalCompare`) en vez de
      `localeCompare` con opciones, y `topValues`: los 10 más frecuentes sin ordenar todos los valores distintos.
      `profileDataFrame` con California: 1517 → 75 ms; con housing-price: 98 → 14 ms.
- [x] **Estadísticos por clase en `AnalyzeDistributions`.** Memorizados con `useMemo` (antes, `profileColumn` de
      cada clase en cada render).
- [x] **Lecturas síncronas de tensores → `await tensor.data()`.**
  - [x] `src/core/controller/trainDenseModel.ts`: evaluación al acabar de entrenar (matriz de confusión).
  - [x] `src/pages/playground/3_ImageClassification/models/_model_28x28.tsx`: predicción de imágenes de 28×28.
  - [x] `src/pages/playground/3_ImageClassification/explainPrediction/runImageClassificationExplain.ts`: LRP.
  - [-] `src/core/history/utils.tsx` y `src/core/history/trainingSummary.ts`: no hace falta; es una rama defensiva que
        no se ejecuta, porque TF.js ya guarda el historial de `fit()` como números.
  - [x] `src/core/explainability/webshap/explainer/lstsq.ts`: reescrito en JavaScript sin tensores. Antes construía W
        como matriz diagonal m×m (250 000 elementos con 500 muestras), multiplicaba con TF.js, leía con `arraySync` y
        no liberaba ninguno de sus 7 tensores; ahora X'WX en O(m·n²). Test nuevo en `tests/explainability/lstsq.test.ts`.
- [x] **Medir otra vez** todos los escenarios y anotar la mejora (en el registro).
- [~] **Compilar los shaders antes de usarlos.** Tras la fase 0, todo lo que bloquea TF.js es compilar los shaders de
      WebGL la primera vez (entrenar Car la segunda vez: 0 ms; clasificar y LRP la segunda vez: 0 ms). El perfil de
      CPU del entrenamiento de MNIST lo confirma: `getShaderParameter` (TF.js esperando a que WebGL compile) suma
      1456 ms.
  - [x] `warmUpModel()` (`src/core/nn-utils/warmUpModel.ts`): una predicción con `ENGINE_COMPILE_ONLY`,
        `checkCompileCompletionAsync()` y `getUniformLocations()` antes de dar el modelo por cargado (los programas no
        están listos hasta entonces). En la página de los modelos de imágenes de 28×28: en la primera clasificación,
        `getShaderParameter` pasa a 5 ms. Lo que queda (≈120 ms en Chrome sin ventana) es trabajo nativo de la GPU por
        software (SwiftShader: "GPU stall due to ReadPixels"), no JavaScript.
  - [ ] Comprobar en un equipo con GPU que, con `KHR_parallel_shader_compile`, el calentamiento no bloquea (Chrome
        sin ventana no tiene la extensión: aquí compila igual, pero al cargar el modelo en vez de al pulsar).
  - [x] LRP (≈300 ms la primera vez) usa otras operaciones que este calentamiento no compila. Hecho: `warmUpLrp()`
        propaga la relevancia con activaciones a cero de la forma de cada capa en modo solo compilar
        (`compileShaders()`, el mismo mecanismo que `warmUpModel`): gradientes, `argMax`, `oneHot`, conv y pooling
        hacia atrás. Va en segundo plano tras cargar el modelo (ya se puede clasificar) y "Explicar" espera a que
        acabe. También en el entrenador de imágenes, tras cada entrenamiento (con `warmUpModel`). Página del modelo:
        primera explicación 345 → 0 ms (cargar el modelo pasa de 355 a ≈440 ms sin `KHR_parallel_shader_compile`);
        entrenador: primera clasificación 226–232 → 0 ms y primera explicación 426–442 → 0 ms. Los mapas de calor son
        idénticos con y sin calentamiento (comprobado con tres imágenes).

## Fase 1 — Infraestructura de workers

- [x] **Protocolo.** Mensajes propios tipados, sin dependencias (`{ id, type, payload }` → `{ id, result }` o
      `{ id, error }`): `src/core/workers/workerProtocol.ts`.
- [x] **Cliente y worker (`src/core/workers/`).** `createWorkerClient` (worker que se crea en la primera petición, ids,
      errores, `terminate`, alternativa en el mismo hilo si no hay `Worker`) y `exposeWorker` (el lado del worker,
      que transfiere los `ArrayBuffer` del resultado en vez de copiarlos).
- [x] **Vite y despliegue.** `worker.format: 'es'`. Comprobado en desarrollo y en las builds con `base` `/n4l`
      (`--mode simidat`) y en la raíz (`--mode netlify`): los dos workers se piden en `/assets/…` y responden 200.
- [x] **Datos por columnas.** `ColumnData_t` y `dataframeColumns()` en `eda.ts`.
- [-] **Hook `useWorkerTask`.** No ha hecho falta: el análisis se pide al cargar un conjunto (en el manejador, no en
      un efecto) y una cuenta de cargas descarta los resultados viejos.
- [x] **Tests.** `tests/core/workers.test.ts`, con un worker de mentira que pasa por `exposeWorker`: respuestas en
      otro orden, errores, transferencias, `terminate` y alternativa sin `Worker`.

## Fase 2 — AED de /analyze en un worker

- [x] **`eda.ts` sin danfo.** `analyzeColumns(columns)` (perfil, valores numéricos y correlaciones) y
      `profileColumns`; `profileDataFrame` queda como envoltorio para danfo.
- [x] **Worker de análisis.** `src/pages/analyze/analysis.worker.ts` (3,35 kB en la build, sin danfo ni TF.js) y
      `analysisClient.ts`; los avisos y los estadísticos por clase dependen de la variable objetivo y son baratos:
      se quedan en el hilo principal.
- [-] **Preprocesado en el worker.** No compensa: 22 ms con California; enviar las columnas cuesta casi lo mismo.
- [x] **Interfaz.** "Analizando el conjunto de datos…" mientras llega el resultado; si se carga otro conjunto entre
      tanto, el resultado viejo se descarta.
- [x] **(Opcional) Leer el CSV en el worker** (papaparse lo admite). Con 206 400 filas es lo que más bloquea (≈580 ms);
      el `DataFrame` de danfo hace falta en el hilo principal (tabla, consultas, «Más gráficos»). Hecho: lo que sube
      el usuario (en el AED y en los entrenadores) se lee en `datasetReader.worker.ts` (28 kB): pasar a CSV si es
      ARFF, JSON, JSONL o Parquet, averiguar el separador, papaparse con las opciones de danfo y los arreglos de las
      columnas; el worker calcula además el tipo de cada columna con las reglas de danfo pero mirando todas las filas
      (no solo las 500 primeras), así que `DataFrameFixMixedColumns` ya no hace falta para estos ficheros (y se evita
      su `asType`, que fallaba con valores ausentes). En el hilo principal solo queda `new dfd.DataFrame(rows,
      { columns, dtypes })`. Medido sin danfo: `readCSV` eran ≈500 ms de papaparse y 22 ms de crear el DataFrame.
      Producción, California × 10: 1844 / 646 → 1393 / 307 ms (bloqueo total / la tarea más larga); lo que queda es
      pintar la tabla de datos de 206 400 filas en Plotly y los DataFrames del preprocesado, repartido en tareas.
- [x] **Medir.** California: 1981 ms de la tarea más larga al empezar → 134 ms. Con 206 400 filas (California × 10),
      el worker baja la tarea más larga de 1478 a 646 ms.
- [x] **Arreglado de paso: CSV grandes.** Con 206 400 filas la página se caía («Maximum call stack size exceeded»):
      `Math.min(...valores)` pasa cada valor como argumento. `extent()` con un bucle en `histogram` y en el escalado.

## Fase 3 — Imágenes: decodificar los sprites en un worker

- [x] **`SpriteImageDataset.loadImages`**: `sprite.worker.ts` (1,33 kB) con `fetch` + `createImageBitmap` +
      `OffscreenCanvas`, solo las filas pedidas, y el `Float32Array` transferido. Comprobado píxel a píxel contra el
      camino de siempre (MNIST y KMNIST: diferencia 0).
- [x] **Un solo camino** para el sprite de test y el completo: `loadSpriteDataset(config, { testOnly })`. La página del
      modelo solo decodifica las imágenes de test (10 000 de 65 000 en MNIST) y reutiliza el conjunto entero si ya se
      cargó al entrenar.
- [x] **Sin copias al repartir.** `subarray` en vez de `slice` para separar entrenamiento y test (MNIST entero son
      204 MB de `Float32Array`; antes se copiaban otra vez).
- [x] **Alternativa sin worker u `OffscreenCanvas`**: si el worker falla, el camino de siempre.
- [x] **Medir.** Cargar las imágenes de test de MNIST: 304 → 0 ms. El pico al entrenar MNIST no era el sprite: es
      compilar los shaders (ver fase 0).

## Fase 4 — Explicabilidad con TF.js en un worker (evaluar primero)

> Tras la fase 0: SHAP global de Car bloquea 114 ms (una tarea) y LRP 286 ms solo la primera vez (0 ms después). Lo
> que queda es compilar shaders: mejor resolverlo calentándolos (fase 0) que copiando el modelo a un worker.

- [-] **Prueba de concepto.** Modelo serializado con `tf.io.withSaveHandler` → `tf.loadLayersModel(tf.io.fromMemory())`
      en el worker. Descartada (ver la decisión).
- [-] **KernelSHAP local y global en el worker.** Descartado: tras reescribir `lstsq`, el SHAP global de Car bloquea
      121 ms en una sola tarea y el resto ya cede el control.
- [-] **LRP de imágenes en el worker.** Descartado: 0 ms a partir de la segunda vez; la primera es compilar shaders.
- [x] **Decidir con las medidas de la fase 0.** No se mueve TF.js: lo que queda es compilar shaders, que un worker no
      evita (también compilaría) y se resuelve mejor calentándolos (fase 0).

## Fase 5 — Entrenamientos en un worker

> Primero se descartó (tras la fase 0, entrenar solo bloqueaba al compilar shaders la primera vez). Se ha hecho porque
> el objetivo es que entrenar no toque nunca el hilo principal.

- [x] **Worker de entrenamiento** (`src/core/training/training.worker.ts`): entrena las redes dense (clasificación
      tabular y regresión) y la convolucional (clasificación de imágenes, que descarga y decodifica el sprite allí
      mismo) con el backend elegido en el navbar. Comprobados webgl, webgpu, wasm y cpu.
- [x] **Construcción de las redes compartida** (`src/core/training/buildModels.ts`): la misma en el worker y en el
      hilo principal (resumen del visor y entrenamiento sin worker). Los errores de la arquitectura (activación sin
      elegir, pérdida o métrica que no compila) se distinguen de los del worker y se avisan como antes.
- [x] **Progreso y parada por mensajes.** El protocolo admite avisos de progreso y peticiones de parar
      (`AbortSignal`): cada lote y cada época llegan al visor de tfjs-vis (`tfvis.show.fitCallbacks`, llamado desde el
      hilo principal) y a "Entrenando… época x de N"; "Detener" para al acabar el lote (Car: 408 ms).
- [x] **El modelo vuelve como datos** (`model.save(tf.io.withSaveHandler())`, pesos transferidos) y se reconstruye con
      `tf.loadLayersModel(tf.io.fromMemory())`; el historial vuelve como números. Predicción, explicabilidad,
      matriz de confusión, tabla de modelos y descarga funcionan igual.
- [x] **Sin worker, como antes.** jsdom (los tests), sin `Worker` o con un backend que el worker no puede usar:
      `trainDenseModel` y `trainImageClassifier` entrenan en el hilo principal.
- [x] **Medir.** Car: 763 / 439 ms de bloqueo la primera vez → 0 ms en desarrollo y una tarea de 51 ms al acabar
      (reconstruir el modelo y pintar la tabla) en producción; además tarda 10 s en vez de 16 s. MNIST: 1554 / 860 ms →
      0 ms en los 92 s de entrenamiento, con el mismo resultado (pérdida 0,056, 8 de 8 imágenes de test bien).
- [x] **Tests.** `tests/core/trainingWorker.test.ts` (las funciones del worker con el backend cpu: avisos, historial,
      evaluación, modelo serializado que se reconstruye y predice, regresión, parar y errores de la arquitectura) y
      `tests/core/workers.test.ts` (progreso, parada y búferes anidados).
- [-] **Tamaño.** El worker lleva su copia de TF.js: 944 kB sin comprimir, que solo se descargan al entrenar por
      primera vez. Si pesa, cargar los backends que no se usen (webgpu, wasm) solo cuando se elijan, como en la página.
      No se puede recortar: 944 kB (249 kB comprimidos) son tfjs-core, layers y los backends webgl y cpu; el converter
      y tfjs-data ya no entran (tree shaking) y webgpu y wasm ya son trozos aparte que solo se descargan al elegirlos.
      Vite construye los workers por separado, así que no pueden compartir el trozo de TF.js de la página.
      Probado y descartado: preparar el worker al abrir el entrenador (crearlo, cargar TF.js y activar el backend
      mientras el navegador está libre). La primera época de Car llega a los 3,9 s con el worker nuevo y a 1,0 s con
      él ya usado, pero prepararlo no cambia nada (3,87 frente a 3,83 s): lo que cuesta es compilar los shaders del
      entrenamiento dentro del worker, que dependen de la red elegida. Solo ahorraría la descarga en conexiones
      lentas, a cambio de descargar TF.js en cada visita aunque no se entrene.

## Fase 6 — Pintar menos (lo que no puede ir a un worker)

- [x] **Cola de tiempo libre** (`src/core/scheduler/idleQueue.ts`): un trabajo de pintado por hueco del navegador
      (`requestIdleCallback`). `N4LPlot` (con `useIdleValue`) y `N4LDataFrameTable` se dibujan ahí, cada uno en su
      propia tarea corta.
- [x] **/analyze: secciones diferidas** (`N4LDeferredMount`): se montan cuando les toca en la cola o, antes, al
      acercarse a la vista. El resumen se pinta al momento.
- [x] **`useDeferredValue`** para la variable objetivo: el selector responde al momento y el análisis se pone al día
      después. California en producción: cambiar el objetivo o el escalado, 0 ms de bloqueo (antes 338 / 312 ms).
- [x] **Gráficos ya calculados.** Histogramas como barras con `binCounts` y diagramas de caja con sus cuartiles y
      bigotes (`boxStats`, como mucho 500 atípicos por grupo): Plotly ya no recorre cada punto (`D.box` tardaba
      1238 ms con 206 400 filas). «Más gráficos» usa una muestra aleatoria de 20 000 filas si hay más.
- [-] **Tablas de Plotly con muchas filas.** No hace falta: dibujar la tabla de California (20 640 filas) cuesta
      35–50 ms y ya va en su propia tarea.
- [-] **Fuera del plan.**
  - Detección de objetos con cámara: face-api ya es asíncrona y depende del vídeo y del DOM.
  - El visor de tfjs-vis.
  - El banco de pruebas de /debug: mide el hilo principal a propósito.

---

## Riesgos y notas

- Cada worker que importe TF.js descarga otra copia: medir el tamaño en la build antes de decidir las fases 4 y 5.
- Clonar datos grandes en `postMessage` también cuesta: transferir `ArrayBuffer` siempre que se pueda.
- jsdom (los tests) no tiene `Worker`: la alternativa en el mismo hilo es obligatoria y es la que prueban los tests.
- Las medidas sin ventana usan WebGL por software: repetir las de TF.js en un equipo con GPU antes de decidir.
- **Medir sobre la build de producción.** En desarrollo, React 19.2 registra cada render y compara sus props para el
  panel de rendimiento (`logComponentRender`, `addObjectDiffToProperties`), y con props de 20 000 valores eso cuesta
  cientos de ms que en producción no existen. (Hasta el 02/10/2026, `.env` tenía `NODE_ENV="development"` y
  `vite build` sin `--mode` empaquetaba React de desarrollo; ya no.) Para medir:
  `npx vite build --mode simidat --outDir /tmp/n4l-perf && npx vite preview --outDir /tmp/n4l-perf --port 4795`.

## Registro

- 02/10/2026 — Lo que quedaba del plan: leer los ficheros subidos en un worker (fase 2) y calentar los shaders de
  LRP (fase 0); el tamaño del worker de entrenamiento se queda como está (fase 5). Build de producción
  (`--mode simidat`):

  | Escenario | Antes | Ahora |
  |---|---|---|
  | /analyze: subir 206 400 filas (California × 10) | 1844 / 646 ms | 1393 / 307 ms |
  | MNIST, página del modelo: primera explicación con LRP | 345 ms | 0 ms |
  | MNIST, página del modelo: abrirla y cargar el modelo | 355 ms | ≈440 ms |
  | MNIST, entrenador: primera clasificación / primera explicación | 229 / 434 ms | 0 / 0 ms |

  Lo único pendiente: comprobar en un equipo con GPU que, con `KHR_parallel_shader_compile`, los calentamientos no
  bloquean (aquí, sin la extensión, compilan igual pero al cargar).
- 02/10/2026 — Fase 5 hecha: los tres entrenamientos (clasificación tabular, regresión y clasificación de imágenes) van
  en un worker. Bloqueo durante el entrenamiento: Car 0 ms (antes 763 ms), MNIST 0 ms (antes 1554 ms). Comprobado con
  webgl, webgpu, wasm y cpu y en las builds de producción.
- 01/10/2026 — Fases 1, 2, 3 y 6 hechas (salvo lo marcado). Build de producción (`--mode simidat`), bloqueo total /
  la tarea más larga, desde el diagnóstico:

  | Escenario | Diagnóstico | Ahora |
  |---|---|---|
  | /analyze: cargar California housing | 2240 / 1989 ms | 265 / 134 ms |
  | /analyze: cargar housing-price | 769 / 701 ms | 310 / 93 ms |
  | /analyze: cambiar el escalado (California) | 312 ms | 0 ms |
  | /analyze: cambiar la variable objetivo (California) | 338 ms | 0 ms |
  | /analyze: cargar 206 400 filas (California × 10) | la página se caía | 1844 / 646 ms |
  | MNIST: cargar las imágenes de test | 304 ms | 0 ms |
  | MNIST: clasificar un ejemplo (primera vez / otra vez) | 295 ms | 141 / 0 ms |
  | MNIST: explicar con LRP (primera vez / otra vez) | 591 ms | 308 / 0 ms |
  | Car: entrenar (primera vez / otra vez) | 1066 / 575 ms | 763 / 439 ms · 0 ms |
  | Car: SHAP global | 367 / 140 ms | 121 / 121 ms |

  Lo que queda: compilar los shaders de WebGL la primera vez (fase 0, pendiente de un equipo con GPU) y leer CSV muy
  grandes (fase 2, opcional). Las fases 4 y 5 (TF.js en un worker) no compensan: tras la fase 0, TF.js solo bloquea
  al compilar shaders.
- 01/10/2026 — Fase 0 hecha. Con `Scripts/perf/longtasks.mjs` (antes → después, bloqueo total / la tarea más larga):

  | Escenario | Antes | Después |
  |---|---|---|
  | /analyze: cargar California housing | 2240 / 1989 ms | 694 / 451 ms |
  | /analyze: cargar housing-price | 769 / 701 ms | 630 / 560 ms |
  | /analyze: cambiar el escalado / la variable objetivo (California) | 312 / 338 ms | 311 / 328 ms |
  | MNIST: clasificar un ejemplo (primera vez / otra vez) | 295 ms | 136 / 0 ms |
  | MNIST: explicar con LRP (primera vez / otra vez) | 591 ms | 286 / 0 ms |
  | Car: entrenar (primera vez / otra vez) | 1066 / 575 ms | 775 / 458 ms · 0 ms |
  | Car: SHAP global | 367 / 140 ms | 114 / 114 ms |

  Conclusión: los cálculos del AED ya están todos por debajo de 100 ms (perfil de California 75 ms, preprocesado
  22 ms); lo que queda en /analyze es pintar (fase 6). En TF.js solo queda compilar shaders la primera vez. Siguen
  mereciendo un worker los sprites de imágenes (fase 3, ~320 ms de cálculo puro) y el AED con CSV muy grandes (fase 2).
- 01/10/2026 — Diagnóstico y plan. Medidas de la tabla con Chrome sin ventana (servidor de desarrollo) y
  `PerformanceObserver` de tareas largas.
