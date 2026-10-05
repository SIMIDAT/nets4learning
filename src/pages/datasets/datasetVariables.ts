import { N4L_CATALOG, n4lPublicFile } from '@core/n4l/catalog'
import { isTableDataset } from '@core/n4l/format'

/** Rol de la variable, como en la tabla de variables de UCI */
export type VariableRole_t = 'ID' | 'Feature' | 'Target' | 'Other'
export type VariableType_t = 'Integer' | 'Continuous' | 'Categorical' | 'Binary'

export type DatasetVariable_t = {
  name        : string
  role        : VariableRole_t
  type        : VariableType_t
  /** En inglés, como en la fuente */
  description?: string
  units?      : string
  /** Celdas vacías o con "?" en los ficheros de la tabla */
  missing     : number
}

/** Variables de uno o varios ficheros con las mismas columnas */
export type VariableTable_t = { files: string[], variables: DatasetVariable_t[] }

// El rol, el tipo, la descripción y las unidades salen de la ficha de cada conjunto en UCI
// (https://archive.ics.uci.edu/api/dataset?id=<id>) o, si no está en UCI, de su documentación original. Las columnas
// y los valores ausentes son los de los ficheros de public/, que a veces renombran columnas o quitan filas incompletas.
// @formatter:off
export const DATASET_VARIABLES: VariableTable_t[] = [
  {
    files    : ['datasets/hepatitis-c.csv'],
    variables: [
      { name: 'Age', role: 'Feature', type: 'Integer', units: 'years', missing: 0 },
      { name: 'Sex', role: 'Feature', type: 'Binary', description: 'f, m', missing: 0 },
      { name: 'ALB', role: 'Feature', type: 'Continuous', description: 'albumin (laboratory data)', missing: 0 },
      { name: 'ALP', role: 'Feature', type: 'Continuous', description: 'alkaline phosphatase (laboratory data)', missing: 0 },
      { name: 'ALT', role: 'Feature', type: 'Continuous', description: 'alanine aminotransferase (laboratory data)', missing: 0 },
      { name: 'AST', role: 'Feature', type: 'Continuous', description: 'aspartate aminotransferase (laboratory data)', missing: 0 },
      { name: 'BIL', role: 'Feature', type: 'Continuous', description: 'bilirubin (laboratory data)', missing: 0 },
      { name: 'CHE', role: 'Feature', type: 'Continuous', description: 'cholinesterase (laboratory data)', missing: 0 },
      { name: 'CHOL', role: 'Feature', type: 'Continuous', description: 'cholesterol (laboratory data)', missing: 0 },
      { name: 'CREA', role: 'Feature', type: 'Continuous', description: 'creatinine (laboratory data)', missing: 0 },
      { name: 'GGT', role: 'Feature', type: 'Continuous', description: 'gamma-glutamyl transferase (laboratory data)', missing: 0 },
      { name: 'PROT', role: 'Feature', type: 'Continuous', description: 'total protein (laboratory data)', missing: 0 },
      { name: 'Category', role: 'Target', type: 'Categorical', description: "diagnosis: '0=Blood Donor', '0s=suspect Blood Donor', '1=Hepatitis', '2=Fibrosis', '3=Cirrhosis'", missing: 0 },
    ],
  },
  {
    files    : ['datasets/ecoli.csv'],
    variables: [
      { name: 'Sequence name', role: 'ID', type: 'Categorical', description: 'Accession number for the SWISS-PROT database', missing: 0 },
      { name: 'mcg', role: 'Feature', type: 'Continuous', description: "McGeoch's method for signal sequence recognition", missing: 0 },
      { name: 'gvh', role: 'Feature', type: 'Continuous', description: "von Heijne's method for signal sequence recognition", missing: 0 },
      { name: 'lip', role: 'Feature', type: 'Binary', description: "von Heijne's Signal Peptidase II consensus sequence score", missing: 0 },
      { name: 'chg', role: 'Feature', type: 'Binary', description: 'Presence of charge on N-terminus of predicted lipoproteins', missing: 0 },
      { name: 'aac', role: 'Feature', type: 'Continuous', description: 'score of discriminant analysis of the amino acid content of outer membrane and periplasmic proteins', missing: 0 },
      { name: 'alm1', role: 'Feature', type: 'Continuous', description: 'score of the ALOM membrane spanning region prediction program', missing: 0 },
      { name: 'alm2', role: 'Feature', type: 'Continuous', description: 'score of ALOM program after excluding putative cleavable signal regions from the sequence', missing: 0 },
      { name: 'Target', role: 'Target', type: 'Categorical', description: 'localization site (cp, im, imL, imS, imU, om, omL, pp)', missing: 0 },
    ],
  },
  {
    files    : ['datasets/titanic.csv'],
    variables: [
      { name: 'Pclass', role: 'Feature', type: 'Categorical', description: 'passenger class', missing: 0 },
      { name: 'TName', role: 'Feature', type: 'Categorical', description: 'title in the passenger name (Mr, Mrs, Miss...)', missing: 0 },
      { name: 'Name', role: 'ID', type: 'Categorical', description: 'passenger name', missing: 0 },
      { name: 'Sex', role: 'Feature', type: 'Binary', description: 'sex', missing: 0 },
      { name: 'Age', role: 'Feature', type: 'Continuous', description: 'age', units: 'years', missing: 0 },
      { name: 'Siblings', role: 'Feature', type: 'Integer', description: 'siblings aboard', missing: 0 },
      { name: 'Parents', role: 'Feature', type: 'Integer', description: 'parents aboard', missing: 0 },
      { name: 'Fare', role: 'Feature', type: 'Continuous', description: 'fare paid', units: '£', missing: 0 },
      { name: 'Survived', role: 'Target', type: 'Binary', description: 'survival indicator (1 = survived, 0 = died)', missing: 0 },
    ],
  },
]
// @formatter:on

/** Tablas de variables de los ficheros de un conjunto de datos */
/** Las fichas de los conjuntos de los paquetes .n4l: sus columnas, del manifiesto */
export const N4L_VARIABLES: VariableTable_t[] = N4L_CATALOG.flatMap((entry) => entry.datasets.filter(isTableDataset).map(({ file, columns }) => ({
  files    : [n4lPublicFile(entry, file)],
  variables: columns.map(({ name, role, type, description, units, missing }) => ({ name, role, type, description, units, missing })),
})))

export const variableTables = (files: string[]) =>
  [...DATASET_VARIABLES, ...N4L_VARIABLES].filter((table) => table.files.some((file) => files.includes(file)))

/** Cuántas columnas de entrada tiene un conjunto y cuál es la que se predice, según su ficha */
export function variablesSummary(files: string[]): { features?: number, target?: string } {
  const variables = variableTables(files)[0]?.variables
  if (variables === undefined) return {}
  return {
    features: variables.filter(({ role }) => role === 'Feature').length,
    target  : variables.find(({ role }) => role === 'Target')?.name,
  }
}
