import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// Azul primario de Bootstrap, el mismo en todas las alertas
const CONFIRM_BUTTON_COLOR = '#0d6efd'

// Las alertas siguen el tema elegido en la aplicación (no el del sistema)
const currentTheme = () => (document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')


type AlertParams = {
  text?  : string
  footer?: string
}
const DEFAULT_SUCCESS_PARAMS: AlertParams = {
  text  : '',
  footer: '',
}

export default class AlertHelper {
  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<ReturnType<typeof MySwal.fire>>}
   */
  static async alertError(title: string, params = { text: 'Error', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      theme             : currentTheme(),
      icon              : 'error',
      title             : title,
      text              : params.text,
      footer            : params.footer,
      html              : params.html,
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
      ...props
    })
  }

  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<ReturnType<typeof MySwal.fire>>}
   */
  static async alertWarning(title: string, params = { text: 'Warning', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      theme             : currentTheme(),
      ...props,
      icon              : 'warning',
      title             : title,
      text              : params.text,
      html              : params.html,
      footer            : params.footer,
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
    })
  }

  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<ReturnType<typeof MySwal.fire>>}
   */
  static async alertInfo(title: string, params = { text: 'Info', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      theme             : currentTheme(),
      ...props,
      icon              : 'question',
      title             : title,
      text              : params.text,
      html              : params.html,
      footer            : params.footer,
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
    })
  }

  /**
   * @param {string} title
   * @param {{text: string, footer?: string, html?: JSX.Element}} params
   * @param {object} props
   * @return {Promise<ReturnType<typeof MySwal.fire>>}
   */

  static async alertSuccess(title: string, params: AlertParams = DEFAULT_SUCCESS_PARAMS, { ...props } = {}) {
    const { text, footer = '' } = params
    return await MySwal.fire({
      theme            : currentTheme(),
      ...props,
      icon             : 'success',
      showConfirmButton: false,
      timer            : 1500,
      title            : title,
      text             : text,
      footer           : footer,
    })
  }
}
