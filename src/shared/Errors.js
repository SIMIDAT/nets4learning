export default class Errors {
  static optionNotValid () {
    const msg = 'Error, option not valid'
    throw new Error(msg)
  }

  static notDispatchedEvent () {
    const msg = 'Error, not dispatched event'
    throw new Error(msg)
  }
}