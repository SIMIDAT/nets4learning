# Auditoría de la explicabilidad (SHAP y LRP)

Revisión, modelo a modelo, de si las explicaciones que muestra Nets4Learning son **correctas** (dicen la verdad
sobre el modelo) y **comprensibles** (un alumno que empieza con la IA entiende qué está viendo).

Todas las medidas se han tomado ejecutando el código real de la aplicación en un navegador (Edge sin
interfaz, WebGL por software) sobre el servidor de desarrollo, con los valores por defecto de la interfaz
salvo que se indique otra cosa.

## 1. Cómo se ha comprobado

Una explicación puede *parecer* razonable y estar mal. Por eso cada modelo se ha pasado por pruebas que no
dependen de la opinión de quien mira el mapa de calor:

| Prueba | Pregunta que responde | Se considera correcta si… |
|---|---|---|
| **Eficiencia** (propiedad de SHAP) | ¿Las contribuciones suman lo que el modelo predice? | `valor base + suma de contribuciones = predicción` (error < 0,001). |
| **Inserción** (fidelidad) | Si destapo primero las zonas que SHAP dice que importan, ¿la predicción sube antes que destapándolas al azar? | El área bajo la curva (AUC) con el orden de SHAP es mayor que con órdenes aleatorios. |
| **Solo las 3 mejores** | ¿Basta con las 3 zonas más importantes para mantener la predicción? | La puntuación con solo esas zonas se parece a la original. |
| **Localización** (detección) | ¿La importancia positiva cae sobre el objeto detectado? | El % de importancia dentro de la caja es claramente mayor que el % de la imagen que ocupa la caja. |
| **Acuerdo con otro método** (tabular) | ¿SHAP ordena las variables igual que la *importancia por permutación* (barajar una columna y ver cuánto cambia el modelo)? | Correlación de Spearman alta (≥ 0,6). |
| **LRP sobre el trazo** (MNIST) | ¿La relevancia positiva está en los píxeles del número? | % de relevancia positiva en el trazo ≫ % de la imagen que ocupa el trazo. |

## 2. Qué se ha mejorado para que se entienda (común a todas las tareas)

Antes, la explicación era solo un mapa de colores o una lista de números sin contexto. Ahora cada explicación
SHAP muestra un resumen en lenguaje llano con la *ecuación* de SHAP, que es la idea clave del método:

Ejemplo real (FACE-DETECTOR con una foto de una cara):

```
Cómo llega el modelo a «Cara»
0 % (con la imagen tapada)  +100 % (suma de contribuciones)  = 100 %
▲ Lo que más empuja a favor: Piel (+72 %), Fondo (fuera de la cara) (+11 %)
```

Ejemplo ilustrativo (IRIS):

```
Cómo llega el modelo a «Iris virginica»
33 % (predicción media sobre los datos de referencia)  +61 % (suma de contribuciones)  = 94 %
▲ Lo que más empuja a favor: petal_length = 5.8 (+38 %), petal_width = 2.2 (+20 %)
```

En imágenes con superpíxeles genéricos (COCO-SSD, MobileNet) se muestra solo la ecuación: una lista de
«zona 5, zona 6» no diría nada sin el mapa, que ya las colorea. En caras, las zonas tienen nombre y sí se listan.

- **Punto de partida explícito**: el alumno ve que SHAP no explica «por qué 95 %», sino «por qué 95 % en vez
  de 2 %» (imagen tapada) o «en vez de la media» (tabular). Antes ese punto de partida no aparecía en ningún sitio.
- **Variables con su valor** (`petal_length = 5.8`), en las unidades originales del formulario cuando es posible.
- **Nombres comprensibles**: «Cara», «Pose del cuerpo», «Mano», «Signo «A»», y en caras las zonas por su
  nombre (piel, labios, ojo derecho…) en lugar de «segmento 3». Las clases tabulares se traducen (antes el
  desplegable mostraba claves internas como `00-tc.iris.Iris-setosa`).
- **Imágenes perturbadas con explicación**: la galería indica que son imágenes que ha visto el modelo con zonas tapadas.
- **Errores con motivo**: «El modelo no ha detectado nada en esta imagen…» en lugar de «Error al calcular la explicación».
- **LRP**: texto que explica rojo/azul y por qué la relevancia total no coincide exactamente con la puntuación.
- **Beeswarm (tabular)**: aviso de que los colores usan los valores normalizados que recibe el modelo.
- Traducido a `es`, `en` y `ja` (1574 claves en los tres idiomas, incluidas las 80 clases de COCO).

## 3. Resultados por tarea y modelo

### 3.1 Clasificación tabular (SHAP)

| Modelo | Eficiencia | Acuerdo SHAP ↔ permutación | Variables más importantes |
|---|---|---|---|
| IRIS | exacta | Spearman **1,00** | petal_length, petal_width |
| CAR | exacta | Spearman **0,94** | Safety, Persons, Buying |
| LYMPHOGRAPHY | exacta | Spearman **0,87** | changes in stru, lymphatics |

**Qué fallaba**
- El desplegable de clase mostraba claves internas (`00-tc.iris.Iris-setosa`). → Corregido.
- La explicación local no decía de dónde partía ni con qué valores de entrada. → Resumen con la ecuación y `variable = valor`.

**Qué falta**
- LYMPHOGRAPHY: los nombres de las variables están cortados a 15 caracteres (`changes in stru`, `bl. of lymph. c`)
  porque así vienen en el conjunto de datos original de UCI; sus «traducciones» repiten el nombre cortado.
  Hay que buscar los nombres completos en una fuente médica fiable antes de traducirlos.

### 3.2 Regresión (SHAP)

| Modelo | Error del modelo (MAE) | Error prediciendo siempre la media | Eficiencia | Spearman |
|---|---|---|---|---|
| AUTO_MPG | 2,63 mpg | 6,56 mpg | exacta | 0,89 |
| STUDENT_PERFORMANCE | 1,55 puntos | 3,43 puntos | exacta | 0,63 |
| WINE | 0,49 puntos | 0,68 puntos | exacta | 0,81 |

Los valores SHAP están en las unidades del objetivo (p. ej. «+2,2 mpg»), lo que es muy didáctico.

**Qué fallaba**
- El tooltip del beeswarm muestra los valores *normalizados* (p. ej. `weight = 0.41`), no los kg del
  formulario: parece un error. → Se avisa bajo el gráfico; el resumen local usa los valores originales.

**Qué falta**
- STUDENT_PERFORMANCE: el acuerdo es moderado (0,63) y variables como `famsize` salen arriba en SHAP pero no
  en permutación. No es un fallo de SHAP: con 30 variables correlacionadas, los dos métodos reparten la
  importancia de forma distinta. Es un buen ejemplo para clase («métodos distintos, respuestas distintas»),
  pero habría que contarlo en la interfaz.

### 3.3 Detección de objetos (SHAP por zonas)

| Modelo | Qué se explica | Eficiencia | Inserción SHAP vs azar | Localización |
|---|---|---|---|---|
| COCO-SSD | puntuación de cada clase detectada | exacta | 0,87 vs 0,34 (perro) · 0,94 vs 0,72 (gato) | 85 % de la importancia en la caja (que ocupa el 46 %) |
| FACE-DETECTOR | hay cara (sí/no) | exacta | 1,00 vs 0,83 | la piel es la zona decisiva (+0,72 de 1) |
| FACE-MESH | hay cara (sí/no) | exacta | 1,00 vs 0,79 | — |
| FACE-API | probabilidad de cada emoción | exacta | 0,88 vs 0,67 («feliz») | piel (+0,67), nariz y labios son las zonas decisivas |
| MOVE-NET | confianza en la pose y en cabeza, brazos y piernas | exacta | pose 0,53 vs 0,38 · cabeza 0,64 vs 0,44 · brazos 0,62 vs 0,48 · piernas 0,42 vs 0,31 | la zona clave de «cabeza» está arriba (y = 0,11) y la de «brazos» a la altura de los hombros (y = 0,31) |
| HAND-SIGN | hay mano / confianza de cada letra | exacta | 0,90 vs 0,50 | 87 % de la importancia en la mano (que ocupa el 35 %) |

**Qué fallaba (ejemplos)**
- **COCO-SSD**: con «Grid Side = 4» la imagen se dividía en **6** zonas en vez de 16 (se pasaba el lado de la
  rejilla como número de segmentos). Además solo contaban las detecciones con puntuación ≥ 0,5, así que la
  salida era un escalón (0 o 0,9) y SHAP apenas distinguía zonas. → 16 zonas y umbral 0,05 al explicar.
- **FACE-DETECTOR**: la explicación salía **vacía** (no había etiquetas que explicar). → Ahora explica «Cara»
  y usa el mapa de zonas faciales (piel, ojos, labios…).
- **FACE-API**: explicaba 8 cosas a la vez, 6 de ellas con valor 0 (emociones que el modelo no veía), y la
  **edad** partía de 0 años con la imagen tapada, así que decía «la piel aporta +43,5 años»: correcto
  matemáticamente, absurdo para un alumno. → Solo se explican las emociones con probabilidad ≥ 10 % y la
  edad deja de explicarse. Además cargaba su propia copia de TensorFlow.js (344 avisos «kernel already
  registered»). → Se usa la versión sin TensorFlow empaquetado: 0 avisos y la explicación pasa de 423 s a 289 s.
- **HAND-SIGN**: explicaba solo «hay mano», nunca la letra reconocida, que es lo interesante. → Explica
  también cada letra que el modelo reconoce (confianza ≥ 7/10 de fingerpose).
- **HAND-SIGN**: el detector de MediaPipe sigue la mano del fotograma anterior (ignora `staticImageMode`), así
  que cada imagen perturbada «recordaba» la anterior: la suma de SHAP (0,984) no cuadraba con la predicción
  (0,993). → Al explicar se reinicia el seguimiento antes de cada predicción (`resetTracking`): la eficiencia
  pasa a ser exacta y la importancia en la mano sube del 79 % al 87 %. Coste: la explicación tarda unas 4 veces
  más (medido con WebGL emulado por CPU; con GPU real es bastante menos).
- **Imágenes subidas dibujadas en espejo** (HAND-SIGN, FACE-MESH, FACE-DETECTOR, MOVE-NET): la página
  procesaba las imágenes con `flipHorizontal: !mirror`, que en MOVE-NET, COCO-SSD y FACE-API vale `true`
  aunque una imagen subida nunca se muestra en espejo. Además, los detectores de MediaPipe de
  `@tensorflow-models` solo activan el espejo, nunca lo desactivan: tras usar la webcam, la imagen subida se
  procesaba reflejada (x media de la mano 117,3 en vez de 95,3 en una imagen de 213 px) y la superposición
  salía al revés. → Imágenes y explicación siempre sin espejo, y `syncMediaPipeMirror` fija el modo en la
  solución de MediaPipe antes de cada predicción.
- **Todos**: si el modelo devolvía un número de valores distinto del esperado, el código lo sustituía en
  silencio por ceros y la explicación salía en blanco sin avisar. → Ahora es un error visible.

**Qué falta**
- ~~FACE-DETECTOR y FACE-MESH devuelven solo «hay cara / no hay cara».~~ → La explicación lleva una nota: muestra
  lo mínimo que necesita ver el modelo para detectar la cara (suele bastar con la piel).
- ~~MOVE-NET: la media de 17 puntos apenas cambiaba al tapar una zona.~~ → Se explica además cada parte del
  cuerpo (cabeza, brazos, piernas). Las piernas se apoyan sobre todo en la zona del tronco: el modelo necesita
  encontrar primero a la persona. Es correcto y se cuenta en una nota bajo la explicación.
- HAND-SIGN solo se ha podido comprobar con «hay mano»: en las fotos de prueba fingerpose no reconoce ninguna
  letra con confianza ≥ 7/10. Falta probarlo con una foto clara de una letra del alfabeto dactilológico.
- Las 1000 clases de ImageNet (MobileNet) siguen en inglés (`leopard`). Las 80 de COCO-SSD ya están traducidas
  en la caja dibujada y en la explicación («Perro con 95 % de confianza»).

### 3.4 Clasificación de imágenes

| Modelo | Método | Resultado |
|---|---|---|
| MNIST | LRP | 10/10 dígitos bien clasificados; el **94–99 %** de la relevancia positiva cae sobre el trazo, que ocupa solo el 7–24 % de la imagen. |
| MobileNet | SHAP | Eficiencia exacta; inserción siempre mejor que el azar (p. ej. 0,57 vs 0,18). |
| KMNIST | — | Desactivado en `DATA_MODEL` (no aparece en la aplicación). |
| ResNet | — | Clase vacía (`// TODO`), sin modelo cargado: no aparece en la aplicación. |

**Qué fallaba (ya corregido en esta PR)**
- La regla α-β de LRP en capas densas usaba en realidad la regla ε.
- Cada clic en «Explicar» explicaba una imagen distinta (la predicción invertía los colores de la imagen original).
- LRP preprocesaba la imagen de forma distinta a la predicción, así que explicaba otra entrada.

**Qué falta / conviene contar al alumno**
- En LRP la suma de la relevancia (p. ej. 14,5) no coincide con la puntuación de la clase (10,3): la regla ε
  «pierde» o «gana» relevancia en los sesgos (*bias*) de cada capa. No es un error; ya se explica en la interfaz.
- MobileNet se equivoca en imágenes del propio ejemplo: el guepardo sale como «leopard» (84 %) y el patito
  como «kit fox» (32 %). La explicación es correcta (muestra en qué se fija para equivocarse), y es un ejemplo
  magnífico para clase. → Todas las explicaciones de imagen muestran ahora: «¿El modelo se ha equivocado? La
  explicación sigue siendo útil: muestra en qué se ha fijado para llegar a esa respuesta».

## 4. Pendiente

- [ ] Nombres completos de las variables de LYMPHOGRAPHY (fuente médica fiable).
  Las fuentes consultadas solo repiten los nombres cortados o completan algunos («block of afferent») y dejan
  el resto con «etc.»; no se traducen por intuición.
- [ ] Traducir las 1000 clases de ImageNet (MobileNet).
- [x] Traducir las 80 clases de COCO-SSD (`en`/`es`/`ja`), en la caja dibujada y en la explicación.
- [x] Nota en FACE-DETECTOR/FACE-MESH sobre la salida sí/no (`EXPLAIN_NOTE_KEY`, genérico para cualquier modelo).
- [x] MOVE-NET: explicación por partes del cuerpo (cabeza, brazos, piernas) además de la pose completa.
- [x] Aviso de que SHAP y la permutación pueden ordenar distinto (texto de la importancia global) y consejo
      común «¿el modelo se ha equivocado?» en todas las explicaciones de imagen.
- [x] Beeswarm: el tooltip muestra el valor original cuando se conoce (regresión: `dataframe_X`, filtrado a la
      vez que `X` para que no se desalineen). Solo queda el aviso de valores normalizados en los CSV subidos de
      clasificación, que no guardan las filas originales.
- [x] `scikitjs` (solo se usaba `trainTestSplit`) traía `mathjs@10` entero: sustituido por una función pura
      propia con tests. danfojs traía además `mathjs@9` (usa `mean`, `median`, `mode`, `std` y `variance`):
      `overrides` de pnpm a nuestro `mathjs@11`; `describe()` da los mismos valores que el cálculo a mano.
      Antes había tres copias de mathjs en el bundle (9, 10 y 11); ahora una.
- [x] Plotly duplicado: nuestros gráficos usan el mismo `plotly.js-dist-min` 2.8 que danfojs (`react-plotly.js/factory`).
- [x] `src/core/nn-review-models/` (11 ficheros, 9,5 MB de modelos antiguos) no se usaba: eliminado.
