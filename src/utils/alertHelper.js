import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

export default class AlertHelper {
  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<SweetAlertResult<T>>}
   */
  static async alertError (title, params = { text: 'Error', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      icon              : 'error',
      title             : title,
      text              : params.text,
      footer            : params.footer,
      html              : params.html,
      confirmButtonColor: '#0081D5',
      ...props
    })
  }

  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<SweetAlertResult<T>>}
   */
  static async alertWarning (title, params = { text: 'Warning', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      icon              : 'warning',
      title             : title,
      text              : params.text,
      html              : params.html,
      footer            : params.footer,
      confirmButtonColor: '#0081D5',
      ...props
    })
  }

  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<SweetAlertResult<T>>}
   */
  static async alertInfo (title, params = { text: 'Info', footer: '', html: <></> }, { ...props } = {}) {
    return await MySwal.fire({
      icon              : 'question',
      title             : title,
      text              : params.text,
      html              : params.html,
      footer            : params.footer,
      confirmButtonColor: '#0081D5',
      ...props
    })
  }

  /**
   *
   * @param {string} title
   * @param {{text: string, footer: string, html: JSX.Element}} params
   * @param {object} props
   * @return {Promise<SweetAlertResult<T>>}
   */
  static async alertSuccess (title, params = { text: 'Success', footer: '', html: <></> }, { ...props } = {}) {
    const { text = 'Error', footer = '', html = <></> } = params || {}
    return await MySwal.fire({
      // position: 'top-end',
      icon             : 'success',
      showConfirmButton: false,
      timer            : 1500,
      title            : title,
      text             : text,
      html             : html,
      footer           : footer,
      ...props
    })
  }
}
