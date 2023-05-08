export class MODEL_TABULAR_CLASSIFICATION {
  TITLE = ""
  LIST_EXAMPLES_RESULTS = []
  LIST_EXAMPLES = []
  DATA_OBJECT = {}
  TABLE_HEADER = []
  CLASSES = []
  FORM = []
  DATA_DEFAULT = {}
  DATA_OBJECT_KEYS = {}
  DATA = [[]]

  constructor(_t) {
    this.t = _t
  }

  loadModel() {
    throw new Error("Error")
  }

  function_v_input(element, index, param) {
    throw new Error("Error")
  }

  DESCRIPTION() {
    return <></>
  }

  HTML_EXAMPLE() {
    return <></>
  }

}

/**
 * @class
 */

/**
 * @abstract
 * @property {function(): JSX.Element} DESCRIPTION
 * @property {function(): JSX.Element} HTML_EXAMPLE
 *
 * @property {Array} [TABLE_HEADER]
 * @property {function(): Promise<>} loadModel
 * @property {function(element: string, index: number, param: string): Promise|Promise<>|string|number} function_v_input
 * @property {Array} CLASSES
 * @property {number} NUM_CLASSES
 * @property {Array} [DATA_CLASSES]
 * @property {object} [DATA_OBJECT]
 * @property {Array<string>} [DATA_OBJECT_KEYS]
 * @property {Object} [DATA_DEFAULT]
 * @property {Array} [DATA_CLASSES_KEYS]
 * @property {Array<Object>} [LIST_EXAMPLES]
 * @property {Array<Object>} [FORM]
 * @property {Array} DATA
 */

/**
 * @interface
 * @static {string} KEY
 * @static {string} TITLE
 * @static {string} URL_MODEL
 * @static {string} URL
 */