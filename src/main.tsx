import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
// import './polyfills'

// import reportWebVitals from './reportWebVitals'
import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
    <App />
)
