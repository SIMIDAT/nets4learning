# Formato .n4l

Un paquete `.n4l` reúne todo lo de **un conjunto de datos**: los datos y su ficha, sus textos en cada idioma y, por cada
tarea en la que se usa, cómo usarlo en ella (el preprocesado, los modelos ya entrenados, el formulario o las imágenes de
ejemplo para predecir, la red por defecto para entrenar…). El iris, por ejemplo, se clasifica y se agrupa con el mismo
CSV; MNIST trae sus imágenes, su red convolucional y sus dígitos de ejemplo.

Es **solo declarativo**: describe qué hay y cómo usarlo, y la aplicación lo interpreta con el motor que nombra cada
tarea (`runtime`). No lleva código, así que abrir un `.n4l` de otra persona es seguro.

## Dónde están

- **Los de la aplicación:** carpetas en `public/n4l/<id>.n4l/`. El plugin `vite/n4lPackages.ts` las recorre al
  arrancar y al construir, comprueba cada una y las reúne en el módulo `virtual:n4l-catalog`. Para añadir un modelo
  basta con dejar su carpeta: no hay que tocar código. En desarrollo, al añadir o cambiar una, la página se recarga.
- **Un fichero `.n4l`:** la misma carpeta comprimida en ZIP (con o sin la carpeta raíz dentro). Sirve para compartir,
  exportar e importar. Se abre con `N4LZipSource` (`src/core/n4l/source.ts`).

Un paquete no válido para la build con un mensaje que dice qué falla y dónde.

## Abrir y descargar

- **Descargar:** en la página de un modelo que sale de un paquete, «Descargar .n4l» da el paquete entero en un fichero
  (`iris-1.0.0.n4l`): el manifiesto, los textos, los datos y cada modelo con sus pesos (`src/core/n4l/export.ts`).
- **Abrir:** en «Paquetes .n4l», en la barra de navegación (`/packages`). El fichero se valida (y se sube a la versión
  actual del formato), tiene que tener alguna tarea que la aplicación ya sepa usar y ocupar como mucho 100 MB. Se guarda
  en el navegador (IndexedDB, base de datos `n4l-packages`) y sale en esa página hasta que se quita: en cada una de sus
  tareas, para probar su modelo (si trae alguno) o entrenar con su conjunto. La barra dice cuántos hay guardados.
- En las direcciones, un paquete abierto va como `local-<id>` (`/playground/tabular-classification/model/local-iris`)
  y sus textos, en el espacio de nombres `n4l-local-<id>`: no chocan con uno de la aplicación con el mismo id. Volver a
  abrir uno con el mismo id lo sustituye.

Las tareas que ya se pueden usar con un paquete están en `src/core/n4l/runtimes.ts`.

## Estructura

```
<conjunto>.n4l/
  manifest.json             qué hay y cómo usarlo
  locales/<idioma>.json     sus textos (uno por idioma de "locales")
  data/…                    los conjuntos de datos (CSV o sprites de imágenes) y su descripción original
  models/<id>/model.json    cada modelo de TF.js, con sus pesos al lado
  examples/…                las imágenes de ejemplo (clasificación de imágenes)
```

## manifest.json

| Campo | |
|---|---|
| `format`, `formatVersion` | `"n4l"` y la versión del formato (ahora, `1`) |
| `id` | el del conjunto, el nombre de la carpeta sin `.n4l` |
| `version` | versión del contenido (semver): se sube al cambiar los datos o un modelo |
| `locales` | los idiomas de sus textos |
| `source` | `url` de la fuente original (`<link1>` en los textos), otras direcciones con nombre en `links` (`<link2>`…) y `citation` en BibTeX |
| `datasets` | cada conjunto, de uno de tres tipos (`kind`, ver abajo) |
| `tasks` | una sección por tarea en la que se usa (ver abajo) |

Los tipos de conjunto (`kind`):

| `kind` | |
|---|---|
| `table` (por defecto) | una tabla: `file` (el CSV), `info` (descripción original), `rows` y su ficha (`columns`) |
| `image-sprite` | imágenes: `file` es un PNG con una imagen aplanada por fila (alto × ancho píxeles; en gris o en RGB), primero las de entrenamiento; `labels`, sus clases en one-hot (un byte por clase); `rows`, cuántas hay; `train`, cuántas son de entrenamiento (las demás, de prueba); `image`, su `width`, `height` y `channels` (1, gris; 3, color) |
| `external` | uno que no va en el paquete por su tamaño o su licencia (ImageNet): su `url` y, si se sabe, `rows` |

Cada sección de `tasks`:

| Campo | |
|---|---|
| `task`, `key` | la tarea y su clave en las direcciones (`/playground/<tarea>/model/<key>`) |
| `runtime` | el motor que la interpreta (`tabular-classification`, `regression`, `clustering`, `image-classification`) |
| `datasets` | los conjuntos que usa (sus `id`); el primero, el que se abre al entrar |
| `listed` | si sale en los menús (por defecto, sí): `false` deja la tarea preparada sin enseñarla |
| `order` | su posición en los menús de la tarea, de menor a mayor; sin ella, después, por el nombre de la carpeta |
| `preprocessing` | pasos por nombre: `label-encoder` (codificar), `drop` (columnas de entrada que no entran en la red, p. ej. con «?») y `min-max` (escalar la entrada). `columns`: `"categorical"`, `"features"` o una lista |
| `classes` | clasificación: las salidas del modelo en orden; cada una, su `id` en el conjunto y otros nombres (`aliases`). Si son caracteres (KMNIST), cómo se leen (`reading`) y el kanji del que vienen (`origin`) |
| `models` | cada modelo, de un formato (`format`, ver abajo), con el `dataset` con el que se entrenó y sus `metrics` con datos que no vio al entrenar (`test_…`) |
| `prediction` | con una tabla, `defaults` del formulario y `examples` (valores y la clase que tienen); con imágenes, `images`: cada una, su `file` y su clase (`expected`), si se sabe. Las formas antiguas de un carácter llevan `old: true` y el kanji del que vienen (`origin`) |
| `training` | `learningRate` y `epochs`, si se proponen, para empezar a entrenar; `layers`: la red por defecto al entrenar, con capas `dense` (`units`, `activation`), `conv2d` (`filters`, `kernelSize`, `activation`), `maxPooling2d` (`poolSize`, `strides`) y `flatten`; `locked: true`, una capa que no se puede cambiar (la salida de la regresión, la entrada de una red de imágenes…) |

Los formatos de modelo (`format`):

| `format` | |
|---|---|
| `tfjs-layers` | un modelo de TF.js del paquete: `path` de su model.json (sus pesos, al lado). Con una tabla, `input` es lo que recibe: `encoded` (las columnas codificadas; por defecto) o `scaled` (además, escaladas con el min-max del conjunto, como los de regresión y los entrenados en la aplicación). Con imágenes, cada píxel entre 0 y 1, como en el sprite |
| `tfjs-mobilenet` | MobileNet (`@tensorflow-models/mobilenet`): no va en el paquete, lo descarga la librería en la `version` (1 o 2) y el ancho (`alpha`) dados |

Cada columna de la ficha lleva `name`, `role` (`Feature`, `Target`, `ID`, `Other`), `type` (`Continuous`, `Integer`,
`Categorical`, `Binary`) y `missing` (valores ausentes). Opcionalmente, `units`, `description` (en inglés, como en la
ficha original) y `options` (los valores posibles, en el orden del formulario).

Todas las rutas son relativas al paquete y no pueden salir de él. El esquema completo está en
`public/n4l/n4l.schema.json`: con `"$schema": "../n4l.schema.json"` en el manifiesto, el editor lo autocompleta y lo
valida.

## Textos (locales/&lt;idioma&gt;.json)

| Clave | |
|---|---|
| `columns`, `classes` | nombre de cada columna y clase de las tablas (comunes a todas las tareas). Las clases de las imágenes pueden tener nombre (`airplane` → «avión») o, si no lo tienen, se enseñan tal cual («7», «お») |
| `options` | texto de cada valor de una columna, si no es el propio valor |
| `tasks.<tarea>.name` | nombre en los menús |
| `tasks.<tarea>.summary` | su frase en /datasets |
| `tasks.<tarea>.title` | título en la página del modelo |
| `tasks.<tarea>.description` | `text` (párrafos) y `sections` (`title`, `text`, `items`): admiten `<b>`, `<i>`, `<link1>…</link1>`, que enlaza a `source.url` (y `<link2>`…, a `source.links`), y las métricas de su primer modelo (`{{test_accuracy, number(style: percent)}}`) |
| `tasks.<tarea>.example` | `text` e `items`: cómo rellenar el formulario |
| `tasks.image-classification.forms` | caracteres con formas antiguas (KMNIST): `title`, `modern`, `old`, `old-alt` y `note` de su tabla |

Las claves de `columns`, `classes` y `options` son el nombre de la columna o la clase con los `.` y `:` cambiados por
`_` (i18next los usa como separadores): `bl. of lymph. c` → `bl_ of lymph_ c`.

En la aplicación, los textos de cada paquete son el espacio de nombres `n4l-<id>` de i18next
(`n4l-iris:tasks.tabular-classification.name`).

## Versiones

- `formatVersion` es la versión del formato. Cada cambio del formato la sube y añade en `src/core/n4l/migrate.ts` la
  migración desde la anterior. Un paquete viejo se sube de versión en versión al cargarlo. Uno de una versión más nueva
  que la aplicación se rechaza: hay que actualizar Nets4Learning.
- `version` es la del contenido del paquete.

## Ampliar el formato

- **Un paso de preprocesado nuevo:** se añade al registro del motor (`STEPS` en `src/core/n4l/tabularData.ts`) sin
  tocar los demás.
- **Una tarea o un tipo de modelo nuevo:** un motor nuevo (`runtime`) que lea su parte del manifiesto.
- **Un campo nuevo opcional:** no cambia la versión del formato. Uno obligatorio, o un cambio de significado, sí:
  `formatVersion` + 1 y su migración.

## Estado

| Tarea | |
|---|---|
| Clasificación tabular | en paquetes: Iris, Coches y Linfografía |
| Regresión | en paquetes: Salarios, Auto MPG, Viviendas de Boston, Rendimiento de estudiantes, Calidad del vino y Cáncer de mama (este, con `listed: false`) |
| Agrupamiento | en paquetes: Iris (compartido con la clasificación tabular), Vino y Tiroides |
| Clasificación de imágenes | en paquetes: MNIST, KMNIST (con las formas antiguas de sus caracteres), CIFAR-10 (fotos en color) e ImageNet (MobileNet V2) |
| Detección | todavía en clases de TypeScript |

La clasificación de imágenes (`src/core/n4l/imageClassification.ts`) sabe usar un modelo de TF.js con un sprite de
imágenes de hasta 64×64, en gris (se puede dibujar) o en color (se sube una foto), que se entrena en el navegador y se
explica con LRP (y SHAP, las de color), o MobileNet con un conjunto externo.

## Calidad de los modelos

`tests/models/N4L_QUALITY.test.ts` pasa cada modelo ya entrenado de cada paquete por su conjunto, preparado según el
manifiesto como lo hace la página del modelo: en clasificación tabular exige más del 90 % de aciertos y en regresión,
las métricas de prueba de su manifiesto. `tests/models/N4L_IMAGES.test.ts` clasifica imágenes de prueba de MNIST y
KMNIST como la página del modelo (desde el lienzo).

## Medir un modelo de imágenes

`Scripts/measure_image_models.py --package <id> [--write]` ejecuta cada modelo de TF.js del paquete con numpy, capa a
capa, con las imágenes de prueba de su sprite (las que siguen a las de entrenamiento) y, con `--write`, guarda en su
manifiesto `test_accuracy` y `test_images`. Las 10.000 de prueba de MNIST son las de prueba oficiales; las de KMNIST y
CIFAR-10, un subconjunto equilibrado de las suyas.

## El paquete de CIFAR-10

Su modelo lo entrena `Scripts/train_cifar10_model.py` (PyTorch) con las 50.000 imágenes de entrenamiento oficiales, con
BatchNormalization, que al guardarlo se funde en sus Conv2D: la red que se guarda solo tiene las capas que sabe explicar
LRP. `Scripts/build_cifar10_package.py` prepara después el sprite (500 de entrenamiento y 200 de prueba por clase), una
foto de ejemplo de cada clase y el manifiesto; y `Scripts/measure_image_models.py --package cifar10 --write`, sus
métricas. CIFAR-10 se descarga la primera vez en `~/.cache/nets4learning/`.

## Reentrenar un modelo de regresión

Las métricas de prueba de cada modelo (`metrics`) se enseñan en la página del modelo; si no mejora a predecir siempre la
media, se avisa. `tests/models/N4L_QUALITY.test.ts` rehace la misma partición de prueba con el preprocesado de la
aplicación y comprueba que salen esas métricas.

`Scripts/train_regression_models.mjs --package <id> --model <id> [--write [--force]]` prepara el conjunto como la aplicación
(con el preprocesado del paquete), aparta un 20 % para prueba, entrena varias redes y elige la de menor error de
validación. Solo si mejora el R² de prueba del modelo actual lo guarda en el paquete (con `--write`): su model.json y
sus pesos, sus métricas de prueba en `metrics` (`test_r2`, `test_mae`, `test_baseline_mae`) y la versión del paquete
subida. `--force` lo guarda aunque no mejore: cuando el modelo actual pudo entrenarse con esas filas de prueba, su
nota sale inflada.
