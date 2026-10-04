import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'

import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n'
import { applyTheme, detectTheme, readSavedTheme, systemPrefersDark } from '@core/theme'
import { startupTFBackend } from '@core/tfBackend'
import { registerServiceWorker } from '@core/offline/offline'

// Antes de pintar nada, para que no se vea un instante el tema claro
applyTheme(detectTheme(readSavedTheme(), systemPrefersDark()))
// Empieza a cargar el backend de TF.js que eligió el usuario mientras se pinta la página (App lo espera)
void startupTFBackend()
// Para seguir usando sin conexión lo que ya se ha abierto (solo en la versión publicada)
registerServiceWorker()

const container = document.getElementById('root')
if (container === null) {
  throw new Error('index.html debe tener un elemento con id="root"')
}
const root = createRoot(container)
root.render(
    <App />
)
