import { waitFor, waitForElementToBeRemoved, screen } from '@testing-library/react'
import { renderApp, renderWithRouter } from './setup/utils'
import TestPageEasy from '@pages/TestPageEasy'

describe('App', () => {

  test('renders App', async () => {
    const { getByText } = renderApp()
    await waitFor(() => {})
    await waitForElementToBeRemoved(() => screen.getByText(/Loading\.\.\./i))
    // expect(getByText(/Loading\.\.\./i)).toBeInTheDocument()
    expect(getByText(/pages\.index\.regression\.1-title/i)).toBeInTheDocument()
  })

  test('renders TestPage', () => {
    const { getByText } = renderWithRouter(<TestPageEasy />)
    expect(getByText(/TestPage-Easy/i)).toBeInTheDocument()
  })

})