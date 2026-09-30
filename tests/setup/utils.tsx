import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import App from '@/App'

type Route_t = { basename?: string, path?: string[] }

// Misma base que usa <App /> (VITE_PATH), si no el router no reconoce ninguna ruta
const goTo = ({ basename = import.meta.env.VITE_PATH, path = [] }: Route_t) => {
  window.history.pushState({}, '', basename + (path.length > 0 ? '/' + path.join('/') : ''))
  return basename
}

/** Renderiza la aplicación completa en la ruta indicada. <App /> ya monta su propio router. */
export const renderApp = (route: Route_t = {}) => {
  goTo(route)
  return {
    user: userEvent.setup(),
    ...render(<App />),
  }
}

/** Renderiza un componente suelto dentro de un router, en la ruta indicada. */
export const renderWithRouter = (ui: React.ReactElement, route: Route_t = {}) => {
  const basename = goTo(route)
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: ({ children }) => <BrowserRouter basename={basename}>{children}</BrowserRouter> }),
  }
}
