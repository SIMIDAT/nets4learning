// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

window.URL.createObjectURL = jest.fn()
window.scrollTo = jest.fn()

global.console = {
  ...console,
  // uncomment to ignore a specific log level
  debug: jest.fn(),
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}
