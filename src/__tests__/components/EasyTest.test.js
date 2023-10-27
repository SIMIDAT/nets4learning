import { render } from '@testing-library/react'
import TestComponentEasy from '@components/TestComponentEasy'

describe('EasyTest', () => {
  test('renders EasyTest', () => {
    const { getByText } = render(<TestComponentEasy />)
    expect(getByText(/TestComponentEasy/)).toBeInTheDocument()
  })
})