import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from '@/App'

/**
 *
 * @param ui
 * @param {{basename?: string, path?: string[]}} route
 * @return {object}
 */
export const renderWithRouter = (ui, route = {}) => {
  if (route.basename === undefined) route.basename = '/nets4learning'
  if (route.path === undefined) route.path = []
  let slash = route.path.length > 0 ? '/' : ''
  const _address = route.basename + slash + route.path.join('/')

  window.history.pushState({}, 'Test page', _address)
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: BrowserRouter }),
  }
}

export const renderAppWithMemoryRouter = (route = {}) => {
  if (route.basename === undefined) route.basename = '/nets4learning'
  if (route.path === undefined) route.path = []
  let slash = route.path.length > 0 ? '/' : ''
  const _address = route.basename + slash + route.path.join('/')

  return {
    render: render(
      <MemoryRouter initialEntries={[_address]}>
        <App />
      </MemoryRouter>,
    ),
    user  : userEvent.setup(),
  }
}