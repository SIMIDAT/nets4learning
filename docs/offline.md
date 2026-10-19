# Sin conexión y modelos guardados (service worker)

Qué guarda Nets4Learning en el navegador para seguir funcionando sin conexión y para no volver a descargar los
modelos preentrenados, dónde está en el código y cómo cambiarlo.

## Principios

- **Nada por adelantado.** El service worker guarda lo que se va usando: no descarga páginas ni modelos que no se hayan
  abierto.
- **Los modelos, aparte.** Los modelos preentrenados (los de detección de objetos, MobileNet…) son lo que más ocupa y lo
  que más tarda en descargarse. Van en su propia caché, `n4l-models-…`, con su propia versión: una versión nueva de la
  aplicación no los vuelve a descargar.
- **También en desarrollo, solo los modelos.** Con `pnpm dev` el service worker se registra en modo «solo modelos»
  (`sw.js?models`): guarda los modelos, pero deja pasar el código que sirve Vite (guardarlo serviría código viejo al
  cambiarlo).
- **Se ve y se borra en `/settings`.** En «Datos guardados en este navegador» se ve lo que ocupa cada cosa, con la lista
  de modelos descargados, y se puede borrar cada modelo, todos o lo guardado para usar sin conexión. «Restablecer todos
  los ajustes» lo borra todo.
- **Nunca las analíticas.** Las peticiones a Google Analytics no se guardan.

## Qué se guarda y cómo

| Qué | Caché | Estrategia |
|---|---|---|
| Páginas (navegación) | `n4l-shell-v1` | Primero la red; sin conexión, la última versión guardada de la aplicación |
| Código con hash en el nombre (`assets/…-<hash>.js`) | `n4l-runtime-v1` | Guardado la primera vez (no cambia nunca) |
| Traducciones, conjuntos de datos, paquetes .n4l | `n4l-runtime-v1` | Lo guardado enseguida y, por detrás, se actualiza |
| Modelos de otras webs (Google Storage, TF Hub, Kaggle, jsDelivr, unpkg) | `n4l-models-v1` | Guardados la primera vez y sin volver a descargarlos: su dirección lleva la versión |
| Modelos de la aplicación (`public/models/`, p. ej. face-api) | `n4l-models-v1` | Lo guardado enseguida y, por detrás, se actualiza |

En modo «solo modelos» (desarrollo) solo se usan las dos últimas filas.

## Código

| Archivo | Qué hace |
|---|---|
| `public/sw.js` | El service worker: qué va a cada caché, sus estrategias, y al activarse borra las cachés de versiones anteriores y pasa a `n4l-models-…` los modelos que una versión anterior guardaba con todo lo demás |
| `src/core/offline/offline.ts` | Registra el service worker (completo en producción, `?models` en desarrollo), dice si hay conexión, cuánto ocupa lo guardado (con los modelos uno a uno) y lo borra |
| `src/core/models/pretrainedModels.ts` | De qué modelo es cada fichero descargado, por su dirección: para la lista de `/settings` y para borrar un modelo |
| `src/pages/settings/Settings.tsx` | «Datos guardados en este navegador» |
| `src/core/downloadProgress.ts` | El progreso de las descargas mientras se carga un modelo (cuenta igual lo que llega de la red y de la caché) |

## Cambiarlo

- **Una versión nueva de la aplicación** no necesita tocar nada: el código lleva hash y lo demás se actualiza por
  detrás. Para empezar de cero las cachés de la aplicación, sube `VERSION` en `public/sw.js`.
- **Un modelo que cambia sin cambiar de dirección** (uno de otra web que se sustituye en el mismo sitio): sube
  `MODELS_VERSION` en `public/sw.js`. Se volverán a descargar todos.
- **Un modelo preentrenado nuevo**: si se descarga de otra web, que su servidor esté en `CDN_HOSTS` (`public/sw.js`); si
  es de la aplicación, en `public/models/`. Para que aparezca con su nombre en `/settings`, añádelo a
  `PRETRAINED_MODELS` (`src/core/models/pretrainedModels.ts`) con una expresión regular que reconozca sus ficheros. Va
  antes que cualquier otro cuyo patrón también encaje (los ficheros de COCO-SSD y de face-api llevan «mobilenet» en el
  nombre, así que van antes que MobileNet).

## Pruebas

- `tests/core/serviceWorker.test.ts` ejecuta `public/sw.js` con cachés y `fetch` de mentira: a qué caché va cada cosa,
  que un modelo no se vuelve a descargar, el modo de desarrollo y el paso de los modelos de una versión anterior.
- `tests/core/offline.test.ts`: de qué modelo es cada fichero y cómo se agrupan.
- `tests/pages/Settings.test.tsx`: la lista de modelos guardados y borrarlos (todos o uno).
