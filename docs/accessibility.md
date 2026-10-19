# Accesibilidad de Nets4Learning

Qué nivel se busca, cómo se comprueba, qué patrones usa el código y qué queda por hacer. El plan por fases, con lo hecho
y lo pendiente, está en `TODO-A11y.md`.

## Objetivo

- **WCAG 2.2 AA en toda la aplicación.** Incluye WCAG 2.1 AA, que es lo que exige la UNE-EN 301 549. Si la aplicación se
  publica como web de la Universidad de Jaén, también le aplica el RD 1112/2018, que pide además una declaración de
  accesibilidad y una forma de comunicar barreras (fase 7 del plan).
- **Para cualquier persona.** Para quien usa lector de pantalla o magnificador, para quien navega solo con el teclado,
  un conmutador o la voz, para quien tiene baja visión o no distingue colores y para quien necesita menos movimiento,
  más tiempo o textos más claros.

### Excepciones

| Qué | Por qué | Alternativa en la aplicación |
|---|---|---|
| Visor de tfjs-vis (`#tfjs-visor-container`) | Es de una librería: sus regiones no reciben el foco y sus gráficas no tienen texto. Se excluye de axe (`e2e/axe.ts`) | Cada entrenador tiene sus propias gráficas con descripción y sus datos; el resumen del modelo es una tabla de la página; en /settings se puede elegir que no se abra al entrenar |
| Imagen de la cámara en la detección de objetos | Es vídeo en directo | Pendiente: los objetos detectados en texto (fase 3) |

Una excepción nueva se apunta aquí, con su motivo y su alternativa.

## Cómo se comprueba

Las herramientas automáticas solo encuentran una parte de los problemas. El resto sale de la revisión manual y de las
pruebas con personas (fases 0 y 8 del plan).

| Prueba | Dónde | Qué mira |
|---|---|---|
| axe por página | `e2e/accesibilidad.spec.ts` | Cada ruta de `App.tsx` al cargar, en los temas claro y oscuro. Un test falla si se añade una ruta sin incluirla en la lista |
| axe por estado | `e2e/accesibilidad-estados.spec.ts`, `e2e/movil.spec.ts`, `e2e/series.spec.ts`, `e2e/agrupamiento.spec.ts` | Lo que aparece al usar la aplicación: modales, desplegables, la guía, el aviso de cookies, el resultado de una predicción, los errores, el menú del móvil y los resultados de entrenar |
| Teclado | `e2e/teclado.spec.ts` | Saltar al contenido, el título de cada página y los flujos principales solo con el teclado: de la portada a entrenar, editar las capas y clasificar con un modelo ya entrenado |
| Visión baja | `e2e/vision.spec.ts` | Nada se sale en horizontal a 320 px (zoom al 400 %), con el móvil en horizontal ni con el espaciado de WCAG y el texto al 200 % |
| Títulos | `tests/core/pageTitle.test.ts` | El título de cada ruta, con las traducciones reales (falla si falta una clave en algún idioma) |
| Linter | `eslint.config.ts` (`eslint-plugin-jsx-a11y`, reglas recomendadas) | Textos alternativos, nombres de los controles, ARIA válido, elementos con clic sin teclado… |
| Unitarias | `tests/core/chartColors.test.ts`, `tests/components/N4LNumberField.test.tsx`, `useTrainingProgress.test.ts`… | El contraste de la paleta, los errores de los campos, lo que se anuncia |

Todas las pruebas de axe usan `axeViolations(page)` de `e2e/axe.ts`: WCAG 2.0, 2.1 y 2.2 A y AA, las buenas prácticas
de axe y su regla experimental de etiqueta en el nombre (2.5.3). Antes de analizar sube al principio de la página: si no, la barra de navegación fija tapa lo que pasa por
debajo y axe lo cuenta como un objetivo demasiado pequeño.

```bash
pnpm lint                                        # incluye jsx-a11y
pnpm exec vitest run tests/core/pageTitle.test.ts
pnpm exec playwright test e2e/accesibilidad.spec.ts e2e/accesibilidad-estados.spec.ts e2e/teclado.spec.ts
```

### Revisión manual (en cada versión)

- [ ] NVDA con Firefox y con Chrome (Windows).
- [ ] VoiceOver con Safari (macOS e iOS).
- [ ] TalkBack con Chrome (Android).
- [ ] Solo con el teclado: todo se alcanza, el orden es lógico, el foco se ve siempre y no queda atrapado.
- [ ] Zoom al 200 % y al 400 % (y a 320 px de ancho): nada se corta ni obliga a desplazarse en dos direcciones.
- [ ] Alto contraste de Windows (colores forzados).
- [ ] Control por voz (Voice Access o Control por voz de Apple): cada control se activa diciendo lo que se ve.
- [ ] Movimiento reducido activado en el sistema: no hay animaciones que no se puedan parar.

Para cada flujo: entrenar una red con un conjunto de ejemplo, probar un modelo ya entrenado, subir un fichero propio,
analizar un conjunto en el AED y seguir la guía de una página.

## En cada cambio

La plantilla de los pull requests (`.github/pull_request_template.md`) tiene un apartado de accesibilidad con lo que hay
que revisar: teclado y foco, nombres y textos alternativos, anuncios y errores, contraste y color, 320 px, texto al
200 % y ajustes de /settings, y que lo nuevo esté en las pruebas. Las comprobaciones de `.github/workflows/checks.yaml`
(lint con jsx-a11y, tipos, unitarias y todas las e2e, con axe y teclado) se lanzan en cada pull request y antes de
publicar: si fallan, no se publica.

## Mantenimiento

- La declaración de accesibilidad está en `/accessibility` (`src/pages/accessibility/Accessibility.tsx`): se revisa
  cada año y en cada versión mayor, junto con la revisión manual de arriba. Al revisarla, cambiar su fecha
  (`pages.accessibility.updated`) y el contenido no accesible si ha cambiado.
- Las barreras que nos comuniquen llegan como incidencias con la plantilla `.github/ISSUE_TEMPLATE/accessibility.md`
  (etiqueta `accesibilidad`).
- Lo pendiente y lo hecho, por fases, en `TODO-A11y.md`.

## Patrones del código

Lo que ya resuelve la aplicación y cómo usarlo en lo nuevo.

| Necesidad | Cómo | Dónde |
|---|---|---|
| Título de la página (2.4.2) | Se pone solo según la ruta, en el idioma elegido: «Pasajeros de avión - Entrenar un modelo - Series temporales - Nets4Learning». Una página nueva añade su clave en `PAGE_TITLES` | `src/core/pageTitle.ts`, `N4LPageTitle` |
| Saltar al contenido (2.4.1) | Primer elemento al tabular; lleva el foco al `<main>` de la página | `N4LSkipLink` |
| Foco al cambiar de página (2.4.3) | Va al `h1` de la página nueva. Cada página tiene un solo `<main>` y un `h1` dentro | `N4LScrollManager` |
| Foco visible y sin tapar (2.4.7, 2.4.11) | Anillo de 3 px (`--n4l-focus-color`) en todo lo que se maneja con el teclado y margen (`scroll-margin`) para que la barra fija no tape lo que tiene el foco. No quitar el `outline` sin poner otro. Lo que va dentro de una barra fija o pegada al borde no lleva margen: si no, al pulsarlo el navegador mueve la página | `src/globals.css` |
| Encabezados (1.3.1) | Un `h1` por página y después `h2`, `h3`… sin saltos. El aspecto se cambia con clases (`className={'h5'}`), no con el nivel | — |
| Contraste (1.4.3, 1.4.11) | Los colores de Bootstrap que no llegan están corregidos en los dos temas: enlaces, botones de contorno, `.link-primary`, `.link-secondary`, el código y los bordes de los campos (`--n4l-input-border-color`) | `src/globals.css` |
| Algo que el lector tiene que oír sin mover el foco (4.1.3) | `announce(mensaje)`: el resultado de una predicción, los datos cargados, cómo va un entrenamiento (cada 10 s como mucho), los avisos de las capas, los cambios de ajustes. No poner `aria-live` en algo que aparece a la vez que su texto: no siempre se lee | `src/core/a11y/announce.ts`, `N4LAnnouncer` |
| Aviso de que algo ha ido bien (4.1.3, 2.2.1) | `alertHelper.alertSuccess`: en una esquina, sin llevarse el foco, se para con el ratón encima y se puede cerrar. No esperar (`await`) a que se cierre | `src/utils/alertHelper.tsx` |
| Error que hay que leer | `alertHelper.alertError`: diálogo con el foco en su botón | `src/utils/alertHelper.tsx` |
| Modales (4.1.2) | `aria-labelledby` con el id (`useId`) de su `Modal.Title` y `closeLabel={t('modal.close')}` en `Modal.Header` (el de Bootstrap dice «Close»). El tabulador da la vuelta dentro de cualquier diálogo modal (`aria-modal`) sin hacer nada más | `N4LModal` y los demás modales, `N4LDialogFocusWrap` |
| Campo numérico (3.3.1, 3.3.3) | `N4LNumberField`: deja borrar y escribir; si no vale, lo dice junto al campo (`aria-invalid`, `aria-describedby`) con el rango y el valor que se sigue usando. No recortar en silencio | `src/components/form/N4LNumberField.tsx` |
| Subir ficheros | `DragAndDrop`: botón «Elegir fichero» que dice los formatos y una región de estado con lo aceptado y lo rechazado (traducido) | `src/components/dragAndDrop/DragAndDrop.tsx` |
| Colores de las gráficas (1.4.11) | `chartColor(nombre, tema)` y `categoryColor(orden, i, tema)` con `useTheme()`: cada color tiene un tono por tema con al menos 3:1 (lo comprueba `tests/core/chartColors.test.ts`). No poner colores sueltos | `src/core/chartColors.ts` |
| Selector con miles de opciones | `N4LVirtualSelect` con `label` (qué se elige): el botón solo enseña la opción elegida | `src/components/select/N4LVirtualSelect.tsx` |
| Elementos de un desplegable | `as={N4LDropdownLink}` o `as={N4LDropdownButton}`: React-Bootstrap pone `aria-selected`, que no vale en enlaces ni botones. El elegido, con `aria-current` | `src/components/dropdown/N4LDropdownItems.tsx` |
| Botón que se sustituye o desaparece | Pasar el foco al que lo sustituye y devolverlo después; si no, se pierde en `<body>`. Al terminar de entrenar, «Ir al resultado» (`resultSection`); al borrar una capa, a la de al lado; al cerrar la guía o el aviso de cookies, a lo que los abrió | `N4LTrainButton`, `N4LEditorLayers`, `N4LGuide`, `N4LCookiesBanner` |
| Resumen del modelo | Tabla propia (capas, forma de salida, parámetros), no el visor de tfjs-vis | `N4LModelSummaryButton` |
| Gráficas (1.1.1, 1.3.1) | `aria-label` con lo que enseñan y sus valores principales (en Chart.js, con `role="img"`) o una frase visible debajo, y siempre «Ver los datos» con la tabla completa: `N4LChartData` (o `table` en `N4LPlot`). Si distinguen series por color, también por la forma del punto o el trazo de la línea | `src/components/chart/N4LChartData.tsx`, `plotTables.ts` |
| Lienzos y canvas | Con nombre (`role="img"` y `aria-label`) o fuera del lector si lo que enseñan ya está en texto. Lo que se detecta o se predice, en texto y anunciado. Lo que exige arrastrar, con una alternativa de un clic | `customCanvasDrawer`, `detectionSummary.ts`, `NeuralNetwork` |
| Imágenes (1.1.1) | `alt` con lo que enseña; `alt=""` solo si es decorativa o si su botón ya lo dice. En el manual, el texto entre corchetes de la imagen | `public/docs/*/` |
| Algo que se desplaza (2.1.1) | `tabIndex={0}`, `role={'region'}` y un `aria-label` distinto en cada uno, para recorrerlo con el teclado | `Contribute`, `GlossaryFormula` |
| Término con ayuda | `N4LHelpTerm`: un botón que enseña la ayuda con el foco o con el ratón encima | `src/components/helpLink/N4LHelpTerm.tsx` |
| Tablas largas | `N4LPagination`: en un `<nav>` con nombre, la página actual con `aria-current` y botones de al menos 32 px | `src/components/table/N4LPagination.tsx` |
| Texto en otro idioma (3.1.2) | `lang="en"` en las descripciones originales de los conjuntos (UCI) y en las citas; `lang="ja"` en los caracteres japoneses | `DatasetVariables`, `AnalyzeVariables`, `N4LPackageDescription` |
| Idioma de la página (3.1.1) | `index.html` pone `lang` antes de que cargue la aplicación; después lo cambia i18n | `index.html`, `src/i18n.ts` |
| Movimiento | En JavaScript, `prefersReducedMotion()` (el ajuste de /settings o el del sistema); en CSS ya se anulan las animaciones y transiciones con los dos | `src/core/a11y/displaySettings.ts`, `src/globals.css` |
| Ajustes de accesibilidad | Tamaño del texto, espaciado, alto contraste, menos movimiento, enlaces subrayados, foco grueso y visor de tfjs-vis, en `<html>` (atributo y clases). Lo nuevo tiene que verse bien con ellos: lo comprueban `e2e/vision.spec.ts` y `accesibilidad-estados.spec.ts` | `displaySettings.ts`, `/settings` |
| Ayuda al pasar el ratón (1.4.13) | `N4LHelpTerm`: se puede pasar el ratón por encima, se cierra con Escape y se abre al pulsarlo. No usar `OverlayTrigger` con `hover` | `src/components/helpLink/N4LHelpTerm.tsx` |
| Lo que no se puede deshacer (3.3.4) | `N4LConfirmButton`: pregunta en el sitio qué se pierde, con el foco en «Cancelar». Si se puede, mejor deshacer (como al borrar una capa: `onRestore` en `N4LEditorLayers`) | `src/components/form/N4LConfirmButton.tsx` |
| Qué se hace en la página | `N4LPageHeader` con `intro` («train», «review», «detect»): una frase y los pasos, antes de todo lo demás | `src/components/neural-network/N4LPageHeader.tsx` |
| Términos técnicos | `N4LHelpTerm` con su definición (`pages.playground.generator.help.*`) la primera vez que salen en un formulario | `N4LHyperparameterFields`, `N4LDenseLayerFields` |
| Tiempos | `formatDuration` para decir cuánto falta o cuánto tardó, en palabras | `src/core/format/duration.ts` |
| Responsive | Nada se sale en horizontal a 320 px ni con el texto al 200 %; lo que tenga que desplazarse (tablas), con su propio desplazamiento y enfocable | `e2e/vision.spec.ts` |

## Inventario de componentes interactivos

Estado de cada componente con el teclado, con lector de pantalla y en contraste, para repartir el trabajo de las fases
2 y 3. «Pendiente» quiere decir que falta revisarlo a mano o arreglarlo (la fase del plan va entre paréntesis).

| Componente | Teclado | Lector de pantalla | Contraste | Pendiente |
|---|---|---|---|---|
| Barra de navegación y desplegables | Sí (`e2e/teclado.spec.ts`); en el móvil, Escape cierra el menú | Sí (navegación con nombre, página actual, menú abierto o cerrado) | Sí | — |
| Selector con búsqueda (`N4LVirtualSelect`) | Sí (flechas, Enter, `aria-activedescendant`) | Dice qué se elige; revisar con NVDA y VoiceOver | Sí | — |
| Editor de capas | Sí, también arreglar los avisos (`e2e/teclado.spec.ts`) | Los avisos se anuncian al aparecer | Sí | — |
| Hiperparámetros | Sí | Sí, con el error junto al campo | Sí | — |
| Botón de entrenar y progreso | Sí, el foco no se pierde; «Ir al resultado» | Empieza, cada 10 s y si se para | Sí | — |
| Visor de tfjs-vis | No | No | — | Excepción (arriba) |
| Gráficas (Chart.js, Plotly) | Sí, «Ver los datos» | Descripción y tabla con los datos | Sí (paleta común, 3:1; no solo color) | — |
| Lienzo para dibujar | Con puntero; con teclado, los ejemplos y las imágenes de prueba | Con nombre y la alternativa | Sí | Dibujar con el teclado (opcional) |
| Cámara y detección de objetos | Sí (interruptor, botones) | Lo detectado en texto; con la cámara, al pulsar un botón | — | — |
| Imágenes de ejemplo | Sí | Sí, con su clase | Sí | — |
| Tablas paginadas | Sí | Sí | Sí | — |
| Modales | Sí (foco dentro, da la vuelta, Escape, vuelve al botón) | Sí, con nombre | Sí | — |
| Guía de la página | Sí (flechas, Escape, el foco va y vuelve) | Diálogo con el nombre del paso; cada paso se anuncia | Sí | — |
| Avisos (SweetAlert2) | Sí | Éxito como estado; error como diálogo | Sí | — |
| Aviso de cookies | Sí, justo después de «Saltar al contenido» | Región con nombre | Sí | — |
| Subir ficheros | Sí, con el botón «Elegir fichero» | Formatos, aceptado y rechazado | Sí | Al subir, el foco al paso siguiente (2) |
| Resumen del modelo | Sí | Tabla con encabezados | Sí | — |
| Ayuda de los términos | Sí (con el foco o al pulsar; Escape la cierra) | Sí | Sí | — |
| Fórmulas (KaTeX) | Sí, si se desplazan | MathML (falta escucharlas con NVDA y VoiceOver) | Sí | — |
| Paso a paso y diagrama de la red | Neuronas con botón y teclado | Lista de capas; cada neurona con nombre y valor | Sí | — |
