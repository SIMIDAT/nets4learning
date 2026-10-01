# TODO — Mejoras de la UI de Nets4Learning

Plan de mejoras de la interfaz, sacado de la revisión del código y de capturas de la app en escritorio y móvil
(30/09/2026). Cada hito agrupa tareas independientes; se marcan a medida que se terminan.

Leyenda: `[x]` hecho · `[ ]` pendiente · `[~]` en curso o hecho a medias (ver nota) · `[-]` descartado.

---

## Hito 1 — Errores visibles (arreglos rápidos)

- [x] **Título de la página de datasets.** Muestra "Contribuye" porque usa la clave `pages.contribute.title`
      (`src/pages/datasets/Datasets.tsx`). Ahora usa `datasets.title` y se quita la cabecera de la tarjeta, que
      repetía el mismo texto.
- [x] **Funciones de pérdida que no funcionan.** `model.compile()` de tfjs-layers solo acepta estos nombres:
      `meanSquaredError`, `meanAbsoluteError`, `meanAbsolutePercentageError`, `meanSquaredLogarithmicError`,
      `squaredHinge`, `hinge`, `categoricalHinge`, `logcosh`, `categoricalCrossentropy`,
      `sparseCategoricalCrossentropy`, `binaryCrossentropy`, `kullbackLeiblerDivergence`, `poisson` y
      `cosineProximity`.
  - Las opciones `losses-*` del selector (salvo `meanSquaredError`) lanzan "Unknown loss" al entrenar.
  - Las opciones `metrics-*` usadas como pérdida no existen en `createLoss()` y entrenan en silencio con
    `categoricalCrossentropy`.
  - Ofrecer solo pérdidas válidas y quitar las métricas del selector de pérdida.
  - Hecho: `LossName_t` y `TYPE_LOSSES` solo tienen pérdidas de tfjs-layers; el selector las agrupa en
    "Clasificación" y "Regresión" (en regresión va primero su grupo). Test nuevo `tests/core/createLoss.test.ts`
    que compila un modelo con cada opción.
- [x] **Pérdida por defecto en clasificación tabular.** Es `meanSquaredError`; debe ser `categoricalCrossentropy`.
- [x] **Pérdida por defecto en clasificación de imágenes.** `'categoricalCrossentropy'` no coincide con ningún
      `value` del selector, así que el selector enseña otra opción distinta de la que se usa. Ahora es
      `'losses-categoricalCrossentropy'`.
- [x] **Métrica por defecto en clasificación tabular.** Era `metrics-binaryAccuracy`, que no está entre las
      opciones del selector (desactivado): enseñaba `CategoricalAccuracy` y entrenaba con `BinaryAccuracy`, que
      con salida one-hot da valores inflados. Ahora es `categoricalAccuracy`.
- [x] **Tasa de aprendizaje como porcentaje entero (1–100).** El campo dice "1" y la tabla "1%" cuando el valor
      real es 0.01, y no se puede poner 0.001. Usar el valor real con un selector de valores típicos en las tres
      tareas que entrenan (tabular, regresión e imágenes). Hecho con `HyperparameterLearningRate`
      (0.0001 … 1, por defecto 0.01), sin divisiones entre 100 ni "%" en las tablas; texto de ayuda y manual
      actualizados.
- [x] **Los enlaces "Más información" borran lo entrenado.** Llevan a `/glossary` o `/manual` en la misma pestaña
      y, como el contexto vive dentro de la ruta del playground, se pierden los modelos. Abrirlos en otra pestaña
      pasando la sección por la URL (el `state` del router no llega a una pestaña nueva). Hecho con
      `N4LHelpLink` (17 enlaces en 10 ficheros); el manual lee `?action=`.
- [x] **El glosario ignora la sección del enlace.** Recibe `?action=task-00-…` pero no tiene secciones que
      correspondan a esas acciones; decidir a qué parte lleva cada enlace y abrirla. Hecho:
      `glossaryTarget.ts` lleva los pasos de datos al apartado de su tarea, los editores al glosario del editor de
      capas o de hiperparámetros y la tabla de modelos a las métricas; el glosario abre ese apartado y se desplaza
      hasta él. Regresión tiene ahora sus propias acciones (`task-01-…`).
- [x] **Textos sin traducir.**
  - Alertas escritas a mano en inglés o en español dentro del código.
  - "Return to Home" y "Error 404" en la página 404.
  - "Light" y "Dark" en el menú de tema.
  - "Manual" escrito a mano en `ImageClassification.tsx`.
  - Hecho: claves nuevas en `error.*`, `warning.*`, `pages.not-found.*` y `header.theme-*` (es, en, ja). De
    paso, `t('error')` devolvía un objeto en `TabularClassification.tsx` y las guías del playground seguían
    diciendo que la tasa de aprendizaje era "un valor entre 0 y 100".
- [x] **URL de modelo inválida en clasificación de imágenes.** Enseña "Error, option not valid" sobre la página
      vacía; debe redirigir a `/404` como hace la clasificación tabular. `createReviewModelInstance` ya no
      muestra la alerta antes de ir a `/404` (afecta a todas las páginas de modelos preentrenados).
- [x] **Tema.** No se guarda ni sigue el tema del sistema (`prefers-color-scheme`); cada recarga vuelve a claro.
      La página 404 tiene el fondo oscuro fijo. Hecho con `src/core/theme.ts` (mismo patrón que el idioma), el
      tema se aplica en `main.tsx` antes de pintar y el menú marca el activo; test en `tests/core/theme.test.ts`.
      La 404 usa los colores del tema.
- [x] **Tarea elegida en la home.** Se guarda en `localStorage` pero nunca se lee. Ahora se lee al entrar (con
      try/catch por si no hay almacenamiento); test en `tests/pages/PageHome.test.tsx`.
- [x] **Nombre del modelo descargado.** Usa el índice dentro de la página de la tabla, así que en la página 2 se
      repiten nombres (tabular, y revisar regresión e imágenes). Ahora usa el mismo ID que la columna de la tabla
      en las tres tareas (desde 1).

## Hito 2 — Flujo y navegación

- [-] **Home con tarjetas de tarea.** Descartado: se probó una tarjeta por tarea con icono y dos botones, pero se
      prefiere el menú original (cuatro botones de colores y la tarjeta de la tarea elegida debajo), que se
      mantiene. Sí se conserva que recuerde la última tarea elegida (hito 1).
- [x] **Cabecera en la home.** Qué es Nets4Learning, a quién va dirigido y enlace al artículo. La home tiene un
      párrafo de presentación; la cita del artículo va en el pie, entre la descripción y los logos.
- [x] **Selección de modelo o dataset como galería.** Tarjetas con la descripción visible (filas, columnas,
      clases, fuente) y un clic para entrar; sobran el desplegable, el botón "Descripción" y el modal. Hecho a
      medias a propósito: cada tarjeta abre el playground con un clic ("Abrir"), pero la descripción completa
      sigue en un modal ("Descripción") porque sale de la clase de cada modelo y cargarlas todas arrastraría
      librerías pesadas. Las listas de opciones pasan a `src/TASK_OPTIONS.ts` (sin registros de modelos) y
      `DATA_MODEL` las reexporta. Una tarea o lista inexistente lleva a `/404`. En la selección de datasets,
      "Subir conjunto de datos - CSV" va aparte ("Tu propio conjunto de datos"), encima de los "Conjuntos de datos
      de ejemplo".
- [x] **Datos de cada dataset en su tarjeta.** Filas, columnas, clases y fuente sin cargar la clase del modelo
      (metadatos en `TASK_OPTIONS.ts` o en las traducciones). Quitar de paso el prefijo "Modelo - " / "Conjunto
      de datos - " de las etiquetas, que en la galería sobra. Hecho:
      "150 filas · 4 características · 3 clases" (o el objetivo en regresión, o "65.000 imágenes de 28×28") en
      las galerías de datasets y de modelos; los números viven en `TASK_OPTIONS.ts` y
      `tests/core/datasetInfo.test.ts` los compara con los CSV. Etiquetas sin el prefijo en los tres idiomas.
- [-] **Colores de tarea.** Descartado: la home conserva sus colores (primary, danger, info y warning). La
      variable `--n4l-task-color` (bordes de la galería de selección) usa esos mismos colores para que cada tarea
      tenga el mismo en todas partes.
- [x] **Aviso de cookies no bloqueante.** Banner inferior con "Aceptar / Rechazar" en lugar del modal estático.
      Hecho con `N4LCookiesBanner` (a nivel de `App`, no solo en la home) y un enlace "Preferencias de cookies" en
      el pie para cambiar la decisión. Borrado `CookiesModal`.
- [x] **Consentimiento de analítica.** Google Analytics se inicia antes del consentimiento (`App.tsx`); iniciarlo
      solo tras aceptar. "Si continúa navegando acepta" no vale como consentimiento según el RGPD. Hecho con
      `src/core/analytics.ts`: se mantiene la cookie `n4l-accept-cookies` (quien ya aceptó no vuelve a ver el
      aviso), las 7 llamadas a `ReactGA.send` pasan por `trackPageView`, que no hace nada sin consentimiento, y
      el texto de términos ya no dice "al navegar aceptas". Tests en `tests/core/analytics.test.ts`.
- [x] **Migas de pan en el playground.** Inicio › Clasificación tabular › Iris, con un selector para cambiar de
      dataset o modelo sin volver a la home. Hecho con `N4LBreadcrumb` en la selección y en el playground; la
      última miga es un desplegable con los demás modelos o datasets de la tarea. Tests en
      `tests/pages/MenuSelect.test.tsx`. De paso, el botón "Activar el tutorial" (ahora siempre visible) ya no
      se estira a la altura del título.
- [x] **Navbar.** Selector de tema como un único botón con icono; idiomas sin banderas (nombre o EN / ES / JA);
      `aria-label` en el enlace de GitHub. Hecho: idiomas con su nombre y `lang` (sin banderas; borrados
      `es.svg` y `gb.svg`), GitHub en otra pestaña con `aria-label` y el logo con `alt=""`. El selector de tema
      se queda como desplegable "Tema" (Claro / Oscuro), por preferencia.

## Hito 3 — Pantalla de entrenamiento

- [x] **Pasos numerados.** 1 Datos → 2 Arquitectura → 3 Entrenar → 4 Modelos → 5 Predecir → 6 Explicar, con estado
      (hecho / bloqueado) y un índice fijo al lado. Los `N4LDivider` ya marcan esas secciones.
      Hecho a medias por elección: los separadores de las tres páginas de entrenamiento van numerados
      ("3 · Modelo"; con un CSV propio aparece el paso de procesamiento y se renumera). Sin índice lateral.
- [x] **Entrenamiento visible en la página.** Gráfica de pérdida y precisión en directo, "Época x/N" y botón de
      detener, en lugar de mandar las curvas al visor de tfjs-vis.
      Hecho: mientras entrena, el botón pasa a ser una barra "Entrenando… época 3 de 10" con "Detener" (el
      modelo se guarda con las épocas completadas y la tabla enseña "2/5"); tras entrenar, curvas de cada métrica
      (entrenamiento y validación) dentro de la tarjeta de modelos, con selector de modelo. El visor de tfjs-vis
      se mantiene. Probado en Chrome con Iris, Auto MPG y MNIST.
- [x] **Tabla de modelos útil.** Precisión y pérdida finales en vez del historial en texto, marcar el mejor
      modelo, botón "Usar para predecir" en cada fila y curvas superpuestas para comparar modelos.
      Hecho: valores finales por métrica con la validación entre paréntesis y marca "Mejor" (menor pérdida de
      validación final). No se añade "Usar para predecir": la tarjeta de predicción ya tiene su selector de
      modelo (ahora numerado desde 1, como la tabla).
- [x] **Editor de capas.** Cabecera de cada capa con su resumen ("Capa 1 · Dense · 10 · relu"); diagrama de red
      sin mezclar idiomas ni abreviaturas ("Layer", "U:", "F.A."). Hecho: "Capa 1 · 10 neuronas · ReLU" en la
      cabecera (tabular y regresión) y el diagrama traducido, con las capas numeradas desde 1 como en el editor.
      El editor de imágenes también (numerado desde 1, antes desde 0), con un resumen común a diagrama y editores
      (`layerSummary.ts`).
- [x] **Hiperparámetros.** Quitar el selector de métrica desactivado y marcar los valores recomendados. Hecho: el
      selector de métrica de clasificación tabular ya se puede usar; de paso, varias métricas no compilaban en
      tfjs-layers ("Unknown metric": mae, mse, mape y cosine con su nombre largo) y ahora se traducen en
      `createMetrics`, con test. No se marcan "recomendados": el texto de ayuda de cada campo ya orienta.
- [x] **Capturas del manual.** `04-editor-hyperparameters.png` (y las demás del editor) ya no coinciden con el
      selector de tasa de aprendizaje ni con los grupos de pérdidas; rehacerlas. Hecho: 10 capturas
      rehechas en inglés y tema claro con `Scripts/capture_manual_screenshots.mjs` (Chrome sin ventana con el
      dataset Car y la arquitectura del tutorial); el manual (es, en, ja) explica ya el modo extendido, la métrica
      por defecto y las curvas y la matriz de confusión. No cambian las de subir y procesar el CSV ni la del visor.
      De paso, en modo extendido cada neurona lleva solo el nombre de su capa (con el texto completo se pisaban).
- [x] **Glosario de pérdidas.** La tabla describe las de `tf.losses.*` (AbsoluteDifference, HuberLoss,
      SoftmaxCrossEntropy…), que ya no están en el selector; alinearla con las pérdidas de tfjs-layers. Hecho: la
      tabla se genera con las mismas listas que el selector (agrupada en clasificación y regresión), con una
      descripción nueva de cada pérdida en los tres idiomas; test en `tests/core/lossGlossary.test.ts`.
- [x] **Estados vacíos.** Icono, mensaje y botón ("Entrena un modelo para ver aquí la predicción") en lugar de
      "Esperando" con una barra gris, gráficas con ejes vacíos o el cuadro negro de "Resultado". Hecho sin icono:
      `N4LEmptyState` (recuadro discontinuo con un texto que dice qué hacer) en los 19 sitios que esperaban una
      acción del usuario; `WaitingPlaceholder` queda para las cargas reales. Las gráficas de predicción y el
      "Resultado" de imágenes enseñan el aviso hasta la primera predicción (el lienzo y la gráfica siguen
      montados, ocultos, porque la predicción dibuja en ellos).
- [x] **Explicabilidad bloqueada sin modelo.** El panel enseña los controles activos antes de que exista un
      modelo o una predicción. Hecho: `TabularShapPanel` recibe `modelReady` y `hasPrediction`; sin modelo solo
      avisa, sin predicción la explicación local avisa y la importancia global sigue disponible. En imágenes el
      botón ya se desactivaba y ahora dice por qué.
- [x] **Detalles de texto.** Paginación que empieza en "0" y repite flechas ("« ‹ ‹ ‹"); en imágenes el botón de
      predecir se llama "Validar" y "Limpiar" está en amarillo. Hecho: la paginación cuenta desde 1, solo enseña
      páginas que existen (los "-" eran los huecos) y se oculta con una sola página; "Clasificar" y "Borrar" (gris
      con borde) en imágenes.

- [x] **Botón "Resumen del modelo" en todos los modelos preentrenados.** Solo estaba en la revisión tabular, en la
      cabecera de la tarjeta y con el texto "Summary" sin traducir. Ahora es `N4LModelSummaryButton`, arriba del
      `Card.Body` de la tarjeta del modelo en tabular, regresión (modelo seleccionado) e imágenes, y cierra el
      visor al salir de la página. Cada modelo tiene su pestaña en el visor con su nombre (en regresión, con el
      CSV: "Calidad del vino (wine-quality-red.csv)") y el resumen se titula "Resumen del modelo: <modelo>".
      De paso: el primer clic no hacía nada, porque `tfvis.visor()` crea el visor ya abierto y el botón lo
      cerraba al momento. Solo aparece con un `LayersModel`: MobileNet (`GraphModel`) y los detectores
      de detección de objetos no admiten `tfvis.show.modelSummary`.
- [x] **Quitar las flags `VITE_SHOW_NEW_FEATURE` y `VITE_NEW_FEATURE`.** Ocultaban la regresión, que ya está
      terminada, y de paso otras partes. Ahora se ven siempre: pestaña de regresión en datasets, regresión en
      el glosario y en el manual, ecuaciones del glosario (optimizadores, activaciones, pérdidas y métricas),
      enlace "AED" del navbar, botón "Activar el tutorial" de clasificación tabular y botón de resumen del
      modelo. Quitadas también de `.env`, `.env.netlify`, `.env.simidat`, del workflow de despliegue (que la
      ponía a `"false"` en Netlify) y del README.

## Hito 4 — Consistencia visual

- [x] **Una sola librería de gráficos.** Hoy conviven Chart.js, Recharts, Plotly, tfjs-vis y vis-network; unificar
      (Chart.js ya es la de por defecto) con una paleta común que funcione en modo oscuro. Hecho hasta donde tiene
      sentido: las gráficas de SHAP (barras y beeswarm) pasan a Chart.js y se quita Recharts (25 paquetes menos);
      el cálculo del beeswarm está en `beeswarmLayout.ts`, con test. Se quedan Plotly (gráficas de danfo),
      tfjs-vis (visor del entrenamiento) y vis-network (diagrama de la red), que cubren cosas que Chart.js no.
- [~] **Tokens de color.** Llevar a `stylesheet.scss` (variables de Bootstrap) y a variables CSS los colores fijos:
      `#E8EaEd`, `#914091`, el borde negro del canvas, los hexadecimales de los TSX y el azul de las alertas
      (`#0081D5`, que no es el primario de Bootstrap). SweetAlert2 debe seguir el tema.
      Hecho: las alertas siguen el tema de la app (`theme` de SweetAlert2) y usan todas el azul primario; las
      aristas del diagrama y las líneas de los separadores ya se ven en tema oscuro (`useTheme` para lo que se
      pinta en canvas). Quedan los colores fijos con variante oscura ya definida y el resto de hexadecimales.
- [-] **Color por tarea.** Reutilizarlo en la home, la selección y la cabecera del playground. Los bordes de la
      galería de selección usan los colores de los botones de la home; falta la cabecera del playground. Sin
      iconos de tarea (se probaron y se quitaron). Se deja así: en la cabecera del
      playground no se añade color, para no cambiar su diseño.
- [x] **Logos del pie en tema oscuro.** SIMIDAT y DaSCI apenas se distinguen sobre el fondo oscuro. Hecho: fondo claro
      redondeado solo en tema oscuro (`.n4l-footer-logo`).
- [~] **Tipografía y CSS.** Barlow como una familia con dos pesos; quitar la fuente Bangers (se descarga y no se
      usa); acotar `#root { white-space: pre-line }`; borrar `N4LFooter.css` (no se importa).

## Hito 5 — Móvil y accesibilidad
      Hecho: fuera Bangers y `N4LFooter.css`. Se dejan a propósito las dos familias de Barlow (el canvas de
      detección de objetos las usa por nombre) y `white-space: pre-line`, que necesitan los `\n` de las
      traducciones.
- [x] **Tablas en móvil.** Indicar que se pueden desplazar en horizontal (la de Iris corta la columna de clase).
      Hecho en `N4LTablePagination`: "Desliza en horizontal para ver todas las columnas →" solo cuando la tabla no
      cabe, y la barra de desplazamiento ya no sale si cabe.
- [x] **Diagrama de red en móvil.** Corta "Salida". Hecho: flecha más pequeña en pantallas estrechas y estilos en
      `NeuralNetwork.css` en lugar de en línea.
- [x] **Botones de las cabeceras de tarjeta en móvil.** "Activar el tutorial" y "Abrir/Cerrar visor" parten el
      texto en varias líneas. Hecho: las cabeceras pasan a
      varias filas (`flex-wrap`) y los botones no parten su texto (tutorial, visor, añadir capas).
- [x] **Encabezados anidados.** No meter `<h2>` dentro de `Accordion.Header`, que ya genera un `h2`. Hecho en 33
      acordeones: el nivel lo da `as` de `Accordion.Header` y las clases `n4l-accordion-h2/h3` mantienen el
      tamaño de letra.
- [-] **Texto alternativo.** 8 `<img>` sin `alt`. No hacía falta: todas lo tienen (el recuento salía de una
      búsqueda por líneas que no veía el `alt` en la línea siguiente). Sí faltaba en el botón de la cámara de
      detección de objetos, que solo tenía un icono: ahora tiene `aria-label`.
- [x] **Contraste.** Botones `outline-info` ("Descripción") y botones amarillos. Los cinco `outline-info` pasan a
      `outline-primary`; los amarillos de la home llevan texto negro y tienen buen contraste.

## Hito 6 — Funciones nuevas

- [x] **Tutorial guiado para quien entra por primera vez.** Joyride ya está integrado y su botón se ve en
      clasificación tabular; falta lanzarlo solo la primera vez y cubrir el resto de tareas.
      Hecho: en la primera visita a cada página de entrenamiento el tour arranca solo (con el punto que late de
      react-joyride) y se marca como visto al empezar, para que no vuelva a salir solo.
- [x] **Glosario dentro de la pantalla.** Recuadro emergente al pulsar "tasa de aprendizaje", "optimizador", etc.
      Hecho sin iconos: las etiquetas de tasa de aprendizaje, épocas, tamaño de prueba, optimizador, pérdida y
      métrica van subrayadas con puntos y enseñan una definición breve al pasar el ratón o con el teclado.
- [x] **Evaluación de cada modelo.** Matriz de confusión y precisión sobre el conjunto de prueba.
      Hecho en clasificación tabular: matriz de confusión del conjunto de validación con el porcentaje de aciertos,
      debajo de las curvas del modelo elegido. En imágenes ya la enseña el visor de tfjs-vis.
- [x] **Matriz de confusión validada y rediseñada.** Fallo corregido: las clases se sacaban con
      `Object.keys(labelEncoder.classes)`, que ordena primero las claves numéricas, mientras que el one-hot de `y`
      sigue el orden de aparición. En Lymphography (clases 3, 2, 4, 1) la matriz y la predicción tras entrenar
      nombraban cada clase con la de otra. Ahora usan `DataFrameUtils.LabelEncoderClasses`. La matriz es más grande y
      centrada: ejes "Clase real" / "Clase predicha", recuento y porcentaje de la fila en cada celda, color según
      esa parte (verde aciertos, rojo errores), total y sensibilidad por fila, precisión por columna y exactitud,
      con ayuda emergente. Los tensores de datos se liberan al acabar el entrenamiento. Comprobado en Chrome: la
      exactitud de la matriz coincide con la `val_categoricalAccuracy` final (Iris 100 %, Car 95,6 %).
- [x] **Guardar y compartir el trabajo.** Exportar e importar la sesión (arquitectura e hiperparámetros), o
      compartirla por URL. Hecho:
      "Exportar configuración" e "Importar configuración" en la cabecera de las tres páginas de entrenamiento
      (fichero JSON con capas e hiperparámetros, validado en `src/core/session/trainingSession.ts`, con tests).
      No se comparte por URL: basta con pasar el fichero.
- [x] **Página de datasets generada desde los modelos.** Hoy es una lista escrita a mano: falta Lymphography y
      las pestañas de imágenes están por hacer. Hecho:
      la tabla principal de cada tarea (clasificación tabular, regresión e imágenes) sale de `TASK_OPTIONS`, con
      los datos de cada dataset, su fuente original y la descarga de los mismos CSV que usa el modelo (ya está
      Lymphography). Los conjuntos que no usa ningún modelo siguen aparte (`extraDatasets.ts`) para practicar
      subiendo un CSV. Test: todos los ficheros existen y cada dataset tiene fuente.
- [x] **Información del dataset en un modal.** En `/datasets` la columna "Número de muestras" pasa a
      "Información", entre Referencia y Descargar, con un botón "Ver información" que abre un modal: resumen
      (filas, características, clases), descripción completa del modelo (se descarga al abrir el modal), enlace a
      la fuente y descargas. Los conjuntos extra muestran el mismo modal sin descripción propia. Tests en
      `tests/pages/Pages.test.tsx` (Iris y hepatitis C).
- [x] **Tabla de variables en el modal del dataset.** El modal pasa a `xl` con dos pestañas: "Información" y
      "Variables". La tabla sigue la de UCI (variable, rol, tipo, descripción, unidades, valores ausentes). Rol, tipo,
      descripción y unidades salen de la ficha de UCI (API `archive.ics.uci.edu/api/dataset?id=<id>`) o, si no está en
      UCI, de la documentación original (Boston, new-thyroid, titanic, salary). Las columnas y los valores ausentes
      son los de nuestros CSV (`src/pages/datasets/datasetVariables.ts`). Los conjuntos de imágenes lo explican en la
      pestaña. Tests: cada CSV tabular tiene tabla y coincide con sus columnas y ausentes.

---

## Registro

- 30/09/2026 — Plan creado. Empiezo por el hito 1.
- 01/10/2026 — Avisos de Rollup de mathjs ("/* #__PURE__ */ … cannot interpret") en la build: mathjs 11 → 12.4.3
  (también el override de danfojs), que ya no trae esas anotaciones. Además, en la build el require("mathjs") de
  danfojs recibe la versión ESM (alias en `vite.config.ts`): antes iban dos copias (CJS entera y ESM) y ahora una,
  unos 965 KB menos de JS (240 KB con gzip). Verificado: `tsc -b`, `pnpm lint`, 164 tests, build de Netlify sin
  esos avisos y, sobre la build servida, SHAP (local y beeswarm) y la página de AED (describe, gráficos y matriz de
  correlación) sin errores.
- 01/10/2026 — Matriz de confusión: clases en el orden del one-hot (fallo en Lymphography) y nuevo diseño.
  Verificado: `tsc -b`, `pnpm lint`, 36 ficheros de tests (164 tests) y entrenamientos en Chrome (Iris, Car,
  Lymphography) en tema claro y oscuro.
- 01/10/2026 — Tabla de variables (pestaña "Variables") en el modal de cada dataset, con datos de UCI.
  Verificado: `tsc -b`, `pnpm lint`, tests y capturas de HCV, Student Performance y MNIST.
- 01/10/2026 — Curvas de aprendizaje con borde y el modal de información en `/datasets`. Verificado: `tsc -b`,
  `pnpm lint`, 35 ficheros de tests (154 tests) y capturas de la tabla y del modal de Iris.
- 01/10/2026 — Hechos el glosario por secciones, las métricas que no compilaban, los datos de los datasets, el
  tutorial inicial, la ayuda emergente, la matriz de confusión, la página de datasets y las capturas del manual.
  Después: exportar e importar la configuración y las gráficas de SHAP en Chart.js (sin Recharts). Verificado:
  `tsc -b`, `pnpm lint`, 35 ficheros de tests (152 tests), build de Netlify y pruebas reales en Chrome.
- 01/10/2026 — Hito 3 casi completo (faltan hiperparámetros y capturas del manual) y buena parte de los hitos 4 y
  5. Verificado: `tsc -b`, `pnpm lint`, 30 ficheros de tests (124 tests), capturas en móvil y tema oscuro y
  entrenamientos reales con progreso y "Detener".
- 30/09/2026 — Cambios de rumbo en el hito 2: vuelve el menú original de la home, fuera los iconos de tarea, el
  selector de tema vuelve a ser un desplegable y la cita del artículo pasa al pie.
- 30/09/2026 — Hito 2 hecho salvo los datos de cada dataset en su tarjeta. Verificado: `tsc -b`, `pnpm lint`,
  28 ficheros de tests (114 tests) y capturas de la home (claro, oscuro y móvil), la galería y las migas en el
  playground.
- 30/09/2026 — Hito 1 hecho salvo "El glosario ignora la sección del enlace" (necesita decidir el contenido).
  Verificado: `tsc -b`, `pnpm lint`, 26 ficheros de tests (106 tests) en verde, capturas de datasets y 404 (tema
  claro y oscuro del sistema) y entrenamiento real en Chrome sin ventana: Iris (pérdida por defecto y
  `kullbackLeiblerDivergence`), Auto MPG y MNIST entrenan con tasa 0.01 y sin errores en consola.
