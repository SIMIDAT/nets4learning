# TODO — Accesibilidad de Nets4Learning

Objetivo: que cualquier persona pueda usar toda la aplicación (aprender, analizar datos, entrenar y probar redes) sea
cual sea su discapacidad. Eso incluye a quien usa lector de pantalla o magnificador, a quien navega solo con el
teclado, un conmutador o la voz, a quien tiene baja visión o no distingue colores, y a quien necesita menos movimiento,
más tiempo o textos más claros. Plan sacado de revisar el código y de pasar axe con WCAG 2.2 AA y buenas prácticas por
las páginas principales (11/10/2026). Cada fase agrupa tareas independientes; se marcan a medida que se terminan.

**Nivel que se busca:** WCAG 2.2 AA. Incluye el WCAG 2.1 AA que exige la UNE-EN 301 549. Si la aplicación se publica
como web de la Universidad de Jaén, le aplica el RD 1112/2018 (accesibilidad de las webs del sector público), que
además pide una declaración de accesibilidad y una forma de comunicar barreras (fase 7).

Leyenda: `[x]` hecho, `[ ]` pendiente, `[~]` en curso o hecho a medias (ver nota), `[-]` descartado.

---

## Diagnóstico (11/10/2026)

### Lo que ya está

- [x] Pruebas de axe (WCAG 2.1 A y AA) en unas 25 páginas, en los temas claro y oscuro (`e2e/accesibilidad.spec.ts`),
      y en los resultados del agrupamiento y de las series temporales tras entrenar. Todas pasan.
- [x] Al cambiar de página, el foco va al título de la nueva (`N4LScrollManager`), también si tarda en cargar.
- [x] `lang` del documento según el idioma elegido (`src/i18n.ts`) y `lang="ja"` en los caracteres japoneses de KMNIST.
- [x] Movimiento reducido (`prefers-reduced-motion`) en la guía, el paso a paso, el índice de secciones, la animación
      del glosario, el fondo de la 404 y las imágenes de ejemplo.
- [x] Regiones `aria-live` en el progreso del entrenamiento, en el aviso de carga de las páginas y en los avisos de
      «Empieza aquí».
- [x] Descripción (`aria-label`) en casi todas las gráficas de Chart.js y Plotly.
- [x] Ayuda de los hiperparámetros también con el teclado (el popover se abre con el foco, no solo al pasar el ratón).
- [x] Guía de cada página con voz, que se puede silenciar, repetir o hacer avanzar sola.
- [x] Ninguna página se sale en horizontal en el móvil (`e2e/movil.spec.ts`).

### Lo que falla (encontrado)

| Problema | Dónde | WCAG |
|---|---|---|
| El `<title>` es «Nets4Learning» en todas las páginas | toda la aplicación | 2.4.2 (A) |
| No hay enlace para saltar al contenido: con el teclado, antes se pasa por los 12 enlaces y menús de la barra de navegación | toda la aplicación | 2.4.1 (A) |
| `index.html` empieza con `lang="en"` aunque la aplicación esté en español hasta que carga i18n | `index.html` | 3.1.1 (A) |
| Las descripciones de las fichas de variables (UCI) están en inglés dentro de páginas en español, sin `lang="en"` | `/datasets`, AED | 3.1.2 (AA) |
| Orden de encabezados con saltos: 10 en el glosario y otros en `/select-model`, `/manual` y el AED | varias | 1.3.1 (A) |
| Texto sin contraste suficiente: 2 casos en el AED y 1 en `/learn` | AED, `/learn` | 1.4.3 (AA) |
| Objetivos táctiles de menos de 24 × 24 px | páginas de modelos y entrenadores | 2.5.8 (AA, 2.2) |
| Tres gráficas sin descripción: comparación de modelos, explicación del modelo y SHAP (enjambre) | `N4LModelComparison`, `ModelExplanationChart`, `ShapBeeswarmChart` | 1.1.1 (A) |
| Las gráficas complejas solo tienen una frase; sus datos no se pueden leer (sin tabla alternativa) | toda la aplicación | 1.1.1, 1.3.1 |
| Información que solo da el color: los grupos del agrupamiento, las líneas de las series y los mapas de calor | agrupamiento, series, AED | 1.4.1 (A) |
| «Modelo entrenado» (SweetAlert2) se cierra solo a los 1,5 s y se lleva el foco | `alertHelper.alertSuccess` | 2.2.1 (A), 4.1.3 (AA) |
| La detección de objetos (con cámara o con una foto) solo dibuja los resultados en un `canvas`: no hay texto | detección de objetos | 1.1.1 (A) |
| Dibujar un dígito exige arrastrar (hay alternativas, pero no en todas partes) | clasificación de imágenes | 2.5.7 (AA, 2.2) |
| El visor de tfjs-vis no es accesible: regiones sin foco y gráficas sin texto | entrenadores, resumen del modelo | 2.1.1, 1.1.1 |
| Sin estilos para los colores forzados (alto contraste de Windows) | toda la aplicación | 1.4.11 |
| La barra de navegación fija y la de secciones pueden tapar el elemento con el foco | páginas largas | 2.4.11 (AA, 2.2) |
| Los campos numéricos (épocas, ventana, k…) recortan los valores en silencio, sin mensaje de error | entrenadores | 3.3.1 (A) |
| Sin `eslint-plugin-jsx-a11y` y sin pruebas de teclado; las de axe no usan WCAG 2.2 | pruebas | — |
| No hay declaración de accesibilidad ni forma de comunicar barreras | — | RD 1112/2018 |

Las herramientas automáticas solo encuentran una parte de los problemas: el resto sale de las pruebas con teclado, con
lectores de pantalla y, sobre todo, con personas con discapacidad (fases 0 y 8).

---

## Fase 0 — Base: objetivo, herramientas y medición

Para medir cada fase igual antes y después, y para que lo arreglado no se vuelva a romper.

- [x] **Nivel de conformidad.** WCAG 2.2 AA para toda la aplicación, apuntado en `docs/accessibility.md` junto con
      las excepciones justificadas (p. ej. el visor de tfjs-vis, que es de una librería).
- [x] **axe con WCAG 2.2.** Añadir `wcag22aa` y `best-practice` a `e2e/accesibilidad.spec.ts` y a las demás
      pruebas de axe, con una sola función compartida (hoy cada spec repite `withTags`). → `e2e/axe.ts`
- [x] **axe en todos los estados, no solo al cargar:** modales abiertos (información de un conjunto, descripción de
      un modelo, compartir sesión), guía abierta, menú móvil abierto, tras entrenar, tras predecir, AED con un
      conjunto cargado, errores de subida y páginas de los paquetes `.n4l`.
      *En `e2e/accesibilidad-estados.spec.ts`, `movil.spec.ts` y `series.spec.ts`; además, los desplegables de la
      barra, el aviso de cookies, la red mal montada con su error y el glosario sin resultados.*
- [x] **Todas las rutas en las pruebas de axe**, también las nuevas, con un test que avise si una ruta de `App.tsx`
      no está en la lista.
- [x] **`eslint-plugin-jsx-a11y`** en `eslint.config.ts`, con las reglas recomendadas en error.
- [x] **Pruebas de teclado (e2e)** de los flujos principales sin ratón: elegir tarea → elegir conjunto → montar la red
      → entrenar → predecir; subir un fichero; abrir un modelo ya entrenado y predecir; analizar un conjunto en el AED.
      → `e2e/teclado.spec.ts` (también saltar al contenido y el título de las páginas).
- [~] **Lista de comprobación manual** (`docs/accessibility.md`) para cada versión. *Escrita; falta pasarla:*
  - [ ] NVDA con Firefox y Chrome (Windows).
  - [ ] VoiceOver con Safari (macOS e iOS).
  - [ ] TalkBack con Chrome (Android).
  - [ ] Solo teclado.
  - [ ] Zoom al 200 % y al 400 %.
  - [ ] Alto contraste de Windows.
  - [ ] Control por voz (Voice Access o Control por voz de Apple).
- [x] **Inventario de componentes interactivos** (selector virtual, editor de capas, lienzo, cámara, gráficas,
      tablas paginadas, guía, visor, alertas…) con su estado en teclado, lector y contraste, para repartir el
      trabajo de las fases 2 y 3. → `docs/accessibility.md`

## Fase 1 — Lo básico que falla hoy (arreglos rápidos)

Problemas de nivel A y AA con un arreglo acotado y mucho efecto en todas las páginas.

- [x] **Título de cada página (2.4.2).** `document.title` según la ruta y lo abierto, en el idioma elegido:
      «Pasajeros de avión - Series temporales - Nets4Learning». Un hook `usePageTitle` que usen todas las páginas, y
      un test que compruebe que ninguna ruta se queda con el título genérico.
      *En vez de un hook en cada página, uno solo para todas (`N4LPageTitle` con `src/core/pageTitle.ts`), que saca el
      título de la ruta; pruebas en `tests/core/pageTitle.test.ts` y `e2e/teclado.spec.ts`.*
- [x] **Saltar al contenido (2.4.1).** Enlace «Saltar al contenido» al principio, visible al recibir el foco, que
      lleve al `<main>`.
- [x] **Regiones (1.3.1).** Un solo `<main>`, `<header>` y `<footer>` por página. `aria-label` en cada `<nav>`
      (principal, migas de pan, índice de secciones, paginación) y en las regiones con nombre.
      *Quitados los `<main>` de dentro de los componentes; los modales y la guía, con nombre.*
- [x] **Idioma inicial (3.1.1).** Poner en `index.html` el idioma guardado o el del navegador antes de que cargue
      i18n (un script pequeño en el `<head>`), para que el lector no empiece a leer en inglés.
- [x] **Partes en otro idioma (3.1.2).** `lang="en"` en las descripciones originales (en inglés) de las fichas de
      variables, en los nombres de las clases y columnas de los conjuntos y en las citas BibTeX.
      *Hecho en las fichas de variables, en las citas y en los nombres de las capas del resumen del modelo. Los
      nombres de clases y columnas no: son los identificadores del fichero, en cualquier idioma (el CSV del aire está
      en español; «vhigh» o «unacc» no son de ninguno), y 3.1.2 exceptúa las palabras de idioma indeterminado.*
- [x] **Orden de encabezados (1.3.1).** Sin saltos de nivel en el glosario, `/select-model`, `/manual` y el AED.
      Repasar la jerarquía de cada página: un `h1` y después `h2`, `h3`… en orden.
- [x] **Contraste de texto (1.4.3).** Arreglar los 2 casos del AED y el de `/learn`. Revisar `text-body-secondary`
      sobre los fondos grises y en el tema oscuro.
- [x] **Contraste de lo que no es texto (1.4.11).** Bordes de los campos, iconos, el anillo del foco, las líneas y
      puntos de las gráficas y las insignias, con al menos 3:1 en los dos temas.
      *Bordes de los campos y de la zona para soltar ficheros, anillo del foco y una paleta común para las gráficas
      (`src/core/chartColors.ts`, con un tono por tema y una prueba que comprueba el 3:1 de cada color). Los iconos
      toman el color del texto. Los textos de error en rojo, con el tono «emphasis» (en el tema oscuro, el rojo de
      Bootstrap se quedaba en 3,4:1).*
- [x] **Tamaño de los objetivos (2.5.8).** Al menos 24 × 24 px (o con separación suficiente) en los botones
      pequeños (`btn-sm`), los botones de cerrar, la paginación y los selectores de las cabeceras.
- [x] **Foco visible y sin tapar (2.4.7, 2.4.11).** Un anillo de foco claro y común a toda la aplicación (sin
      `outline: none` sin sustituto), y `scroll-padding-top` con el alto de la barra fija y del índice de secciones.
- [x] **Gráficas sin descripción (1.1.1).** `aria-label` en `N4LModelComparison`, `ModelExplanationChart` y
      `ShapBeeswarmChart`, como en las demás.
- [x] **Imágenes (1.1.1).** Texto alternativo en las imágenes de ejemplo de la clasificación de imágenes (su clase:
      «un 7 escrito a mano»). Revisar las capturas del manual y las imágenes del glosario. Mantener `alt=""` solo
      en las decorativas.
      *Las capturas del manual tenían de texto alternativo el nombre del fichero: ahora dicen lo que enseñan, en los
      tres idiomas.*
- [x] **«Modelo entrenado» (2.2.1, 4.1.3).** Cambiar la alerta que se cierra sola a los 1,5 s por un mensaje de
      estado (`role="status"`) que no robe el foco y se quede hasta el siguiente entrenamiento. Repasar los demás
      avisos de `alertHelper`: los de error, con foco y botón para cerrarlos.
      *Todos los avisos de éxito son ahora una notificación en una esquina que no se lleva el foco, dura 6 s, se para
      con el ratón encima y tiene botón para cerrarla (el resultado se queda en la página). Los de error ya eran un
      diálogo con el foco en su botón.*

## Fase 2 — Teclado, foco y lectores de pantalla

Que todo lo que se hace con el ratón se pueda hacer con el teclado, en un orden lógico, y que el lector diga qué pasa.

- [~] **Recorrido con teclado de cada página (2.1.1, 2.4.3, 2.1.2):** orden lógico, sin trampas y sin elementos a
      los que no se llega. *Probado en `e2e/teclado.spec.ts` lo de abajo; falta el repaso a mano de cada página
      (fase 0).*
  - [x] Editor de capas: acordeones, añadir y quitar capas, y el aviso de capas con su botón de arreglar.
  - [x] `N4LVirtualSelect` (selector de ejemplos y de valores de una serie), siguiendo el patrón *combobox* de ARIA:
        flechas, Inicio/Fin, escribir para buscar, Escape, y anuncio del número de resultados.
        *Ya lo seguía (con AvPág/RePág y Ctrl+Inicio/Fin, y sus pruebas). Faltaba decir para qué es el botón: solo
        enseñaba la opción elegida («Fila 12»); ahora el lector oye antes qué se elige.*
  - [x] Pestañas, desplegables de la barra de navegación, migas de pan con desplegable, conmutadores (*toggle
        buttons*) y tablas paginadas.
  - [x] Modales (información de un conjunto, descripción de un modelo, compartir sesión, guía): foco inicial
        dentro, el Tab no se sale, Escape cierra y el foco vuelve al botón que lo abrió.
        *El Tab se salía del modal al pasar de su último elemento: `N4LDialogFocusWrap` le hace dar la vuelta.*
- [x] **Mensajes de estado (4.1.3).** Anunciar con `aria-live`, sin mover el foco:
      *Con `announce()` (`src/core/a11y/announce.ts`) y una sola región que está en la página desde el principio
      (`N4LAnnouncer`): una región que aparece a la vez que su texto no siempre se lee.*
  - [x] Entrenamiento: empieza, va por la época N (no cada época: cada 10 % o cada 10 s), termina o se para, y
        con qué error. *Cada 10 s como mucho; al terminar bien lo dice el aviso de «modelo entrenado».*
  - [x] Predicción y clasificación: el resultado.
  - [x] Carga de datos: «144 valores cargados», «fichero rechazado: formato no admitido».
        *Las series y el AED al cargar; lo aceptado y lo rechazado en la zona de ficheros, traducido.*
  - [x] Avisos del editor de capas al cambiar algo, y cambios de idioma, de tema y de backend.
- [~] **Foco tras las acciones (2.4.3).** Al terminar de entrenar, opción de ir al resultado. Al subir un fichero, al
      paso siguiente. Al borrar una capa, a la capa de al lado (no al principio de la página).
      *Hecho: el foco ya no se pierde al empezar a entrenar (pasa a «Detener» y vuelve a «Entrenar»); al terminar,
      un enlace «Ir al resultado» en la clasificación tabular y de imágenes (en regresión y series el resultado está
      justo debajo del botón); al borrar una capa, a la de al lado; el selector del AED, la guía y el aviso de cookies
      devuelven el foco al cerrarse o al terminar de cargar. Falta: al subir un fichero, al paso siguiente.*
- [x] **Errores en los formularios (3.3.1, 3.3.3).** En vez de recortar los valores en silencio, mensaje junto al
      campo (`aria-invalid`, `aria-describedby`) con el rango admitido: épocas, tasa, tamaño del lote, ventana,
      porcentaje de prueba, k, columnas del formulario de predicción.
      *`N4LNumberField`: dice qué se puede escribir y qué valor se sigue usando. Además, antes no se podía borrar el
      número para escribir otro (volvía al mínimo al instante). La tasa es un desplegable y el formulario de
      predicción no recortaba nada.*
- [x] **Subir ficheros.** El área de arrastrar y soltar con un botón visible «Elegir fichero», que se anuncie qué
      formatos admite y qué fichero se ha aceptado o rechazado.
- [x] **Visor de tfjs-vis.** No es accesible y es de una librería:
  - [x] Que no se abra solo al entrenar (ajuste en la fase 4); las curvas propias (`N4LTrainingCurves`) ya lo
        cubren.
        *«Abrir el visor de TensorFlow.js al entrenar», en `/settings` → Accesibilidad: lo respetan los entrenamientos
        densos, de series temporales y de imágenes (`shouldOpenVisor`).*
  - [x] El resumen del modelo como tabla propia y accesible (capas, forma de salida, pesos), en vez de abrir el visor.
- [x] **Guía.** Que se maneje entera con el teclado (Escape, flechas), que se anuncie el paso y que no hable a la vez
      que el lector de pantalla: avisar en `/settings` de que conviene desactivar la voz si se usa un lector.
      *Al abrirse, el foco va al título del paso; al cerrarse, vuelve al botón «Guía».*
- [x] **Aviso de cookies.** Que el foco y el orden del teclado lleguen a él sin tapar el contenido.
      *Va justo después de «Saltar al contenido» y la página deja libre su alto al final. Abierto desde el pie, el foco
      entra en él y vuelve al cerrarlo.*
- [x] **Etiqueta en el nombre (2.5.3).** El nombre accesible de cada control empieza por el texto que se ve (para el
      control por voz): revisar los botones con icono y `aria-label` distinto del texto.
      *La regla experimental de axe (`label-content-name-mismatch`) se pasa en todas las pruebas; los desplegables de
      hiperparámetros tenían de nombre su ayuda en vez de su etiqueta.*

## Fase 3 — Gráficas, imágenes, lienzo y cámara

Lo más propio de esta aplicación: casi todo lo que enseña se ve en gráficas y dibujos.

- [x] **Cada gráfica con sus datos en texto (1.1.1, 1.3.1).** Un botón «Ver los datos» que enseñe una tabla
      accesible con lo dibujado, además de la frase que la describe:
      *`N4LChartData`: botón con `aria-expanded`, tabla con encabezados de fila y columna, paginada si es larga y en
      una región que se alcanza con el tabulador. `N4LPlot` la admite (`table`) para los gráficos de Plotly.*
  - [x] Curvas de entrenamiento y comparación de modelos.
  - [x] Series temporales: valor real, predicho y error de cada fecha. *Real y predicho; el error, en la tabla de
        errores que ya había.*
  - [x] Dispersión del agrupamiento: grupos con sus filas y sus centroides. Codo: k e inercia.
  - [x] SHAP y explicaciones: contribución de cada variable.
  - [x] Gráficas de Plotly del AED: enlazar a la tabla y a las estadísticas que ya existen. *Cada una con su tabla:
        clases del objetivo, histogramas, frecuencias, cajas, correlaciones y correlación con el objetivo.*
  - [x] Matriz de confusión: comprobar que es una tabla con encabezados de fila y columna. *Lo era; tenía una esquina
        `<th>` vacía y el porcentaje gris sin contraste sobre el verde y el rojo.*
- [x] **Resumen de la tendencia.** En las gráficas que lo permiten, una frase que diga lo importante: «la pérdida baja
      de 0,9 a 0,1 en 50 épocas», «la red sigue la serie salvo en los picos de 1960».
      *Debajo de cada curva, a la vista. En las series lo dice el veredicto (cuánto mejora a las predicciones
      sencillas) que ya había.*
- [x] **No solo el color (1.4.1).** Distinguir también por la forma o el texto:
  - [x] Grupos del agrupamiento: forma del marcador distinta y número de grupo. *También en la leyenda.*
  - [x] Líneas de las series: estilo de línea y leyenda con texto, no solo color. *Continua, de puntos y de rayas.*
  - [x] Mapas de calor de correlaciones: el valor en cada celda. *En su tabla (con muchas variables la gráfica no
        cabe con los valores).*
  - [x] Marca del mejor modelo, avisos y errores: siempre con texto o icono con nombre.
        *Ya lo llevaban («Mejor», «Error», «Aviso»). La clase real de una predicción dice si acierta o falla (✓/✗ y,
        para el lector, con palabras); los modelos comparados, con una forma de punto cada uno.*
- [x] **Diagrama de la red y Paso a paso.** Descripción estructurada (lista de capas con sus neuronas y activaciones).
      Las neuronas del paso a paso se recorren con el teclado (ya tienen foco visible), con nombre y valor
      accesibles. *Las neuronas ya eran botones con nombre y valor; su borde, ahora con contraste.*
- [~] **Dibujar un dígito (2.5.7).** Alternativa a arrastrar en todas las páginas con lienzo: elegir una imagen de
      ejemplo o subir una. Opcionalmente, dibujar con el teclado sobre una cuadrícula. El resultado, anunciado.
      *Los ejemplos y las imágenes de prueba ya estaban; el lienzo tiene nombre y dice cuál es la alternativa, y el
      resultado se anuncia. Falta (opcional) dibujar con el teclado.*
- [x] **Detección de objetos.**
  - [x] Lo detectado también en texto: una lista con cada objeto y su confianza (con una foto, al terminar; con la
        cámara, resumida y sin saturar el lector: como mucho cada pocos segundos, o al pulsar un botón).
        *Igual en todos los modelos: usa lo mismo que su explicabilidad.*
  - [x] Que la foto subida (la alternativa a la cámara, que ya existe) funcione igual en todos los modelos y se
        anuncie su resultado.
  - [x] Que la cámara se pueda encender y parar con el teclado. *Es un interruptor.*
- [~] **Fórmulas (KaTeX).** Comprobar que se generan con MathML para los lectores de pantalla y que se leen bien con
      NVDA y VoiceOver. *Se generan con MathML y el dibujo oculto (prueba e2e); falta escucharlas con NVDA y
      VoiceOver.*

## Fase 4 — Visión baja, movimiento y ajustes de accesibilidad

Que cada persona adapte la aplicación a lo que necesita, y que respete lo que ya ha elegido en su sistema.

- [x] **Sección «Accesibilidad» en `/settings`**, guardada como los demás ajustes:
      *`src/core/a11y/displaySettings.ts`: se aplica en `<html>` antes de pintar (`index.html`) y al cambiarla, se
      borra con «Restablecer todo» y no va a las analíticas (diría qué necesidades tiene quien la usa).*
  - [x] Tamaño del texto (100 %, 125 %, 150 %, 200 %). *Con el texto grande, la barra de navegación es la del móvil
        (la del escritorio no cabe).*
  - [x] Más espacio entre líneas, letras y palabras.
  - [x] Tema de alto contraste, además del claro y el oscuro. *En los dos temas; también si el sistema lo pide
        (`prefers-contrast: more`).*
  - [x] Reducir el movimiento aunque el sistema no lo pida.
  - [x] Subrayar siempre los enlaces.
  - [x] Foco más grueso y visible.
  - [x] No abrir el visor de tfjs-vis al entrenar.
  - [x] Guía sin voz y sin avance automático por defecto. *Ya estaba en «Voz de las guías»; la sección enlaza a ella.*
- [x] **Reflow (1.4.10).** Usable a 320 px de ancho y con zoom al 400 % sin desplazarse en dos direcciones (salvo
      las tablas de datos, con su propio desplazamiento y enfocables). Probar el editor de capas, el AED, los
      formularios de predicción y la barra de navegación. *`e2e/vision.spec.ts`, en 13 páginas; los botones del
      editor de capas no bajaban de línea.*
- [x] **Espaciado del texto (1.4.12).** Nada se corta ni se solapa con el espaciado máximo de WCAG. *Probado con el
      espaciado y el texto al 200 %; la tabla de datos que se desplazaba no se podía enfocar.*
- [x] **Colores forzados.** `@media (forced-colors: active)` para insignias, bordes, foco, barras de progreso y
      gráficas, con colores del sistema en Chart.js cuando estén activos. Y `prefers-contrast: more`.
      *Bordes en lo que solo se distinguía por el fondo y el foco con el color de resaltado del sistema. En las
      gráficas, las series se distinguen ya por la forma y el trazo (fase 3), que los colores forzados no quitan.*
- [x] **Movimiento (2.3.3).** Todas las animaciones respetan el movimiento reducido: las de Chart.js, los acordeones,
      la animación del agrupamiento, los avisos y el desplazamiento suave. *La del agrupamiento solo empieza con su
      botón y se puede parar.*
- [x] **Contenido al pasar el ratón o con el foco (1.4.13).** Los popovers de ayuda se cierran con Escape, no se
      cierran al mover el puntero sobre ellos y no tapan lo que se está escribiendo. *También se abren al pulsarlos
      (en pantallas táctiles).*
- [x] **Orientación (1.3.4).** Ninguna página obliga a girar el móvil. *Probado en horizontal.*

## Fase 5 — Comprensión (accesibilidad cognitiva)

Que se entienda qué hacer en cada página y qué ha pasado, sin conocimientos previos.

- [~] **Lenguaje claro.** Revisar los textos más antiguos (descripciones de conjuntos traducidas de forma literal,
      como «Dicho conjunto de datos…»), con frases cortas y términos técnicos explicados la primera vez.
      *Reescritos los «Dicho conjunto…» (vino, cáncer de mama, en español e inglés) y el manual de regresión. Falta
      repasar con calma el resto de descripciones y del manual.*
- [x] **Términos técnicos enlazados al glosario.** Época, pérdida, ventana o activación, con su definición accesible
      con teclado y lector. *Con `N4LHelpTerm` en los hiperparámetros y ahora también en las neuronas y la activación
      de cada capa; la ventana, la estación y la prueba de las series tienen su ayuda escrita debajo, y cada editor
      enlaza a su apartado del glosario.*
- [x] **Qué se hace en cada página, al principio.** Una o dos frases y los pasos, en las páginas de entrenar y de los
      modelos, como en las series temporales. *`N4LPageHeader` con `intro`: entrenar, probar un modelo o detectar.*
- [x] **Ayuda siempre en el mismo sitio (3.2.6).** La guía, el manual y el glosario, en la misma posición en todas
      las páginas. *Ya lo estaban: la guía junto al título, arriba a la derecha; el manual y el glosario en la barra.*
- [x] **Evitar errores (3.3.4).** Confirmar antes de borrar los modelos guardados o una capa con cambios, y poder
      deshacer. *Borrar una capa se puede deshacer; borrar los modelos desde /settings y quitar un paquete `.n4l`
      preguntan antes (`N4LConfirmButton`, con el foco en «Cancelar»). Restablecer todo y borrar los modelos desde el
      aviso del entrenador ya preguntaban. El número de neuronas ya no se rompe al borrarlo para escribir otro.*
- [x] **Tiempo.** Avisar de cuánto tardará un entrenamiento largo antes de empezarlo. Ninguna acción con límite de
      tiempo. *Mientras se entrena, lo que queda (también para el lector, cada 10 s); al terminar, cuánto tardó y
      cuánto por época, para saber qué esperar del siguiente. No hay nada con límite de tiempo.*
- [x] **Resultados explicados con palabras.** Seguir el ejemplo del diagnóstico del entrenamiento y del veredicto de
      las series: decir qué significa un número, no solo darlo. *Ya lo hacían el diagnóstico, el veredicto, la silueta
      del agrupamiento y la matriz de confusión; la tabla de modelos ahora dice cuál es el valor de validación (antes
      iba entre paréntesis).*

## Fase 6 — Móvil y otras tecnologías de apoyo

- [x] **Gestos (2.5.1, 2.5.2).** Todo lo que se hace con varios dedos o con un trazo (zoom de Plotly, dibujar) tiene
      alternativa con un solo toque, y las acciones se hacen al soltar, no al tocar.
      *El zoom de Plotly tiene sus botones (y los datos, su tabla); dibujar, los ejemplos y las imágenes de prueba. Los
      botones actúan al soltar (clic); el lienzo empieza a dibujar al tocar porque dibujar es eso.*
- [~] **Control por voz y por conmutador.** Todos los controles tienen un nombre que se puede decir y se llega a ellos
      en secuencia. *Lo comprueban las pruebas: nombre con el texto que se ve (regla de axe) y recorridos con el
      teclado. Falta probarlo con Voice Access o Control por voz.*
- [ ] **Lectores de pantalla móviles.** Pasar la lista de la fase 0 con VoiceOver (iOS) y TalkBack (Android) en los
      flujos principales.
- [x] **Menú móvil.** Foco dentro al abrirlo, Escape para cerrarlo y anuncio de abierto o cerrado.
      *El botón dice si está abierto (aria-expanded) y lo de dentro va justo después con el tabulador (patrón de
      «disclosure»); Escape lo cierra con el foco en el botón, salvo si hay un desplegable abierto dentro.*

## Fase 7 — Declaración, documentación y mantenimiento

- [x] **Página «Accesibilidad» (`/accessibility`)**, enlazada desde el pie:
  - [x] Declaración de accesibilidad según el modelo de la Decisión de Ejecución (UE) 2018/1523: situación de
        cumplimiento, contenido no accesible y por qué, fecha y forma de revisión.
  - [x] Forma de comunicar barreras: correo o formulario, y plazo de respuesta.
        *Una incidencia de GitHub con su plantilla y la web de SIMIDAT. Falta decidir un plazo de respuesta concreto (el
        RD 1112/2018 lo pide si la web es del sector público) y, si se quiere, un correo.*
  - [x] Cómo usar la aplicación con lector de pantalla y con el teclado (atajos), y los ajustes de la fase 4.
- [x] **`docs/accessibility.md` para quien desarrolla.** Patrones del proyecto (gráfica con tabla, mensaje de estado,
      foco tras una acción, formulario con errores), la lista de comprobación manual y qué revisar en cada cambio.
- [x] **En las revisiones de código.** Un apartado de accesibilidad en la plantilla de los pull requests.
- [x] **CI.** axe (WCAG 2.2 AA), `jsx-a11y` y las pruebas de teclado bloquean la integración si fallan.
      *Ya se lanzaban todas en cada pull request y antes de publicar (`checks.yaml`). Que bloqueen la fusión depende de
      marcarlas como obligatorias en la protección de la rama en GitHub.*
- [x] **Revisión anual** de la declaración y repaso manual completo (fase 0) en cada versión mayor. *Escrito en la
      declaración y en `docs/accessibility.md` (mantenimiento).*
- [x] **Analíticas.** No registrar el uso de tecnologías de apoyo ni de los ajustes de accesibilidad: es información
      sensible. *Los ajustes no van a las analíticas, ni sus clics (`data-analytics-private`), y está en
      `docs/analytics.md`.*

## Fase 8 — Pruebas con personas

Las pruebas automáticas y las de quien desarrolla no sustituyen a las de quien usa la aplicación cada día con una
tecnología de apoyo.

- [ ] **Sesiones con personas con distintas discapacidades:** ceguera (lector de pantalla), baja visión
      (magnificador, alto contraste), motora (teclado, conmutador, voz), sordera y discapacidad cognitiva. Buscarlas
      a través del servicio de atención a la diversidad de la universidad, de la ONCE y de asociaciones.
- [ ] **Tareas de la sesión:** entrenar una red con un conjunto de ejemplo, probar un modelo ya entrenado, subir un
      conjunto propio y entender un resultado.
- [ ] **Lo encontrado, a este plan.** Cada barrera como tarea en la fase que corresponda, y repetir las sesiones tras
      los cambios grandes.
