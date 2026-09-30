import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
// import './polyfills'

// import reportWebVitals from './reportWebVitals'
import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n'
import { applyTheme, detectTheme, readSavedTheme, systemPrefersDark } from '@core/theme'

// Antes de pintar nada, para que no se vea un instante el tema claro
applyTheme(detectTheme(readSavedTheme(), systemPrefersDark()))

const container = document.getElementById('root')
if (container === null) {
  throw new Error('index.html debe tener un elemento con id="root"')
}
const root = createRoot(container)
root.render(
    <App />
)
