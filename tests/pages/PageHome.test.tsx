import { waitFor, fireEvent, render } from '@testing-library/react'
import Home from '@pages/_home/Home'

describe('Page Home', () => {
  test('App / HOME', async () => {
    const { getByTestId, debug: _debug } = render(<Home />)
    const HTML_InitialMenu = getByTestId('Test-InitialMenu')
    expect(HTML_InitialMenu).toBeInTheDocument()

    const Button_InitialMenu_Regression = getByTestId('Test-InitialMenu-Regression')
    await waitFor(() => fireEvent.click(Button_InitialMenu_Regression))
    _debug()
  })
})
