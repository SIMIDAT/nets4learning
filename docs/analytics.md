# Analíticas de Nets4Learning (Google Analytics 4)

Qué se mide, dónde está en el código y cómo configurar la propiedad de GA4 para verlo en los informes.

## Principios

- **Solo con consentimiento.** Google Analytics no se carga hasta que el usuario lo acepta en el aviso de cookies o en
  `/settings`. Antes no se envía nada ni se guarda para enviarlo después. La única excepción es la página en la que el
  usuario está cuando acepta, que se registra en ese momento. Rechazar es tan fácil como aceptar: lo exigen el RGPD, la
  LSSI y la guía de cookies de la AEPD, y sin eso el consentimiento no vale.
- **Sin datos personales ni contenido del usuario.** No se envían los ficheros, sus nombres ni sus valores, ni los
  dibujos o las imágenes de la cámara. Tampoco el texto de los formularios ni los textos de la interfaz (dependen del
  idioma). Solo se envían identificadores estables (`data-testid`, claves de modelos y conjuntos de datos), números
  (épocas, tiempos, tamaños) y categorías.
- **Sin publicidad.** `allow_google_signals` y `allow_ad_personalization_signals` están desactivados y el modo de
  consentimiento deniega `ad_storage`, `ad_user_data` y `ad_personalization`.
- **Solo tráfico real.** Solo se envía en producción (`VITE_ENVIRONMENT=production`). En desarrollo, con las cookies
  aceptadas, cada evento se escribe en la consola (`console.debug('[analytics]', …)`). Con `VITE_GA_DEBUG=true` se
  envía de verdad con `debug_mode`, para verlo en DebugView. Los e2e rechazan las cookies (`e2e/fixtures.ts`).
- Las cookies `_ga` y `_ga_*` duran 13 meses (`cookie_expires`). Por defecto Google usa 2 años.

## Código

| Archivo | Qué hace |
|---|---|
| `src/core/analytics.ts` | Consentimiento, carga de GA, `trackEvent`, contexto de la página, propiedades del usuario |
| `src/core/analyticsPage.ts` | De la URL al contexto de la página (`page_type`, `task`, `mode`, `item`) y el identificador de un clic |
| `src/components/analytics/N4LAnalytics.tsx` | Lo automático: páginas vistas, tiempo en cada página, clics, cambios de idioma, tema y backend, errores y tiempos de carga |
| `src/hooks/useTrainingProgress.ts` | `train_start` / `train_end` de las tres tareas que entrenan |
| `src/core/downloadProgress.ts` | `model_load`: lo que tarda en cargar un modelo y cuánto descarga |
| `src/core/models/downloadConsent.ts` | `download_consent`: la pregunta antes de descargar un modelo grande |
| `src/components/dragAndDrop/DragAndDrop.tsx` | `file_upload` / `file_rejected` de todas las zonas de subida |
| `src/components/guide/N4LGuide.tsx` | `guide_start` / `guide_end` |

Para medir un botón nuevo no hay que escribir código: basta con que tenga `data-testid` (o `data-analytics` si no debe
llevar uno de test).

## Eventos

Todos los eventos llevan el **contexto de la página** en la que ocurren:

| Parámetro | Valores |
|---|---|
| `page_type` | `home`, `select_dataset`, `select_model`, `playground`, `regression_description`, `learn`, `manual`, `glossary`, `datasets`, `analyze`, `contribute`, `terms`, `version`, `settings`, `not_found`, `dev` |
| `task` | `tabular-classification`, `regression`, `image-classification`, `object-detection` |
| `mode` | `train` (entrenar con un conjunto de datos) o `pretrained` (probar un modelo ya entrenado) |
| `item` | El conjunto de datos o el modelo: `CAR`, `IRIS`, `AUTO_MPG`, `UPLOAD`, `IMAGE-MNIST`… En `/analyze`, el de `?dataset=` |

### Navegación y uso

| Evento | Cuándo | Parámetros propios |
|---|---|---|
| `page_view` | Cada cambio de ruta (o de `?dataset=` en el AED) | `page_location`, `page_title` |
| `page_time` | Al salir de una página, cerrar la pestaña o pasar a otra app | `engaged_seconds`: solo el tiempo con la pestaña visible |
| `ui_click` | Clic en un botón, enlace, pestaña o elemento de menú con identificador | `element`: `data-analytics`, `data-testid`, `id` o la ruta del enlace interno |
| `settings_change` | Cambio de idioma, tema o backend de TF.js (desde la barra o desde `/settings`), activar Paso a paso o cambiar el aviso de descargas | `setting` (`language`, `theme`, `tf_backend`, `step_by_step`, `download_warning`), `value`, `outcome` (backend: `completed` o `error` si el navegador no puede usarlo) |
| `consent_granted` | Al aceptar las cookies | `source` (`banner`, `settings`, `terms`) |
| `not_found` | Al llegar a la 404 desde una ruta que no existe | `missing_path` |
| `search` | Búsqueda en el glosario: 1,5 s después de dejar de escribir, con 3 letras o más | `search_term`, `results` (0: lo que se busca y no está) |

### Aprendizaje automático

| Evento | Cuándo | Parámetros propios |
|---|---|---|
| `train_start` | Pulsar «Entrenar» | `epochs`, `learning_rate`, `optimizer`, `loss`, `layers` |
| `train_end` | Fin del entrenamiento | `outcome` (`completed`, `stopped`, `error`), `duration_sec`, `epochs`, `epochs_done` |
| `train_result` | Cómo terminó un entrenamiento que ha dado un modelo (lo usan también los retos de `/learn`) | `accuracy` (aciertos con los datos de prueba, 0–1; solo en clasificación), `hidden_units`, `layers`, `epochs` (entrenadas), `diagnosis` (`good`, `overfitting`, `still-improving`…) |
| `model_load` / `dataset_load` | Carga de un modelo preentrenado (detección, imágenes, CAR…, regresión) o de los datos de la página de un modelo de regresión | `load_ms`, `download_kb` (de la red o de la caché del navegador), `outcome` (`completed`, `error`) |
| `download_consent` | Antes de descargar un modelo grande con ahorro de datos, conexión lenta o «Preguntar siempre»: al preguntar y al aceptar | `reason` (`save-data`, `slow`, `always`), `download_mb`, `outcome` (`shown`, `accepted`) |
| `models_compare` | Activar «Comparar modelos» en las curvas de entrenamiento | `models` (cuántos modelos hay en la tabla) |
| `layer_fix` | Arreglar las capas con el botón de su aviso (antes de entrenar) | `kind` (`output-units`, `output-activation`, `dense-before-flatten`…) |
| `session_share` | Compartir la configuración de una página de entrenamiento con un enlace | `action` (`open`: abrir la ventana; `copy`: copiar el enlace; `native`: compartir con otra aplicación) |
| `predict` | Una predicción o clasificación | `input` (`form`, `drawing`, `image`, `sample`, `test_sample`) |
| `webcam_start` / `webcam_end` | Activar y desactivar la cámara en tiempo real | `duration_sec` (en `webcam_end`) |
| `explain` | Pedir la explicación de una predicción | `method` (`shap`, `lrp`), `scope` (`local`, `global`; en SHAP tabular) |
| `file_upload` | Fichero aceptado en una zona de subida | `zone`, `format` (la extensión: `csv`, `parquet`, `png`…), `size_kb` |
| `file_rejected` | Fichero rechazado (formato no admitido) | `zone`, `format` |

### Guías

| Evento | Cuándo | Parámetros propios |
|---|---|---|
| `guide_start` | Empezar o retomar una guía | `guide_id`, `step`, `steps` |
| `guide_end` | Terminarla o cerrarla | `guide_id`, `step`, `steps`, `outcome` (`completed`, `closed`) |

### Calidad

| Evento | Cuándo | Parámetros propios |
|---|---|---|
| `exception` | Error de JavaScript sin capturar (como mucho 10 distintos por visita) | `description` (100 caracteres), `fatal` |
| `app_performance` | Una vez por visita | `load_ms` (carga completa), `dom_ms` (DOM listo) |

### Propiedades del usuario

`app_language`, `app_theme` y `tf_backend` cambian con el usuario: así se puede segmentar todo por idioma o por backend.

### Automáticos de GA4 (medición mejorada)

`session_start`, `first_visit`, `user_engagement` (tiempo de interacción), `scroll` (90 %), `click` (enlaces externos,
como GitHub o las fuentes de los datos) y `file_download` (descargas de CSV y modelos).

## Configuración en GA4 (una vez)

En **Administrar** de la propiedad `G-3644EFBXMG`:

1. **Recogida y modificación de datos → Flujos de datos → el flujo web (`G-3644EFBXMG`) → Medición mejorada (el
   engranaje, no el interruptor) → Vistas de página → Mostrar configuración avanzada: desmarca «Cambios de página
   basados en eventos del historial del navegador» y guarda.** La aplicación ya envía sus `page_view` con el contexto; si no, cada página contaría dos
   veces. Deja activados el desplazamiento, los clics salientes y las descargas de archivos.
2. **Definiciones personalizadas → Crear dimensiones personalizadas**. Sin esto, los parámetros llegan pero no se pueden
   usar en los informes ni en las exploraciones:
   - Ámbito *evento*: `page_type`, `task`, `mode`, `item`, `element`, `setting`, `value`, `source`, `outcome`,
     `optimizer`, `loss`, `input`, `method`, `scope`, `zone`, `format`, `guide_id`, `missing_path`, `description`.
   - Ámbito *usuario*: `app_language`, `app_theme`, `tf_backend`.
3. **Definiciones personalizadas → Métricas personalizadas** (ámbito evento): `engaged_seconds` (segundos),
   `duration_sec` (segundos), `epochs`, `epochs_done`, `learning_rate`, `layers`, `load_ms` (milisegundos),
   `download_kb`, `size_kb`, `results`, `step`, `steps`, `dom_ms` (milisegundos).
4. **Configuración de datos → Conservación de datos: 14 meses.** El valor por defecto son 2 meses, que limita las
   exploraciones.
5. **Configuración de datos → Recogida de datos:** deja desactivadas las señales de Google.

Los informes se pueden crear en **Explorar**:

- **Modelos y conjuntos de datos más usados:** `page_view` desglosado por `task`, `mode` e `item`.
- **Tiempo por sección:** suma de `engaged_seconds` de `page_time` por `page_type` o `item`.
- **Embudo de entrenamiento:** `page_view` (`mode=train`) → `train_start` → `train_end` con `outcome=completed`.
- **Botones:** `ui_click` por `element`, filtrado por `page_type`.
- **Rendimiento real:** media de `load_ms` de `model_load` por `item` y `tf_backend`; `app_performance` por
  dispositivo.
- **Guías:** `guide_end` por `guide_id` y `outcome`, y en qué `step` se cierran.
- **Errores:** `exception` por `description` y navegador.
