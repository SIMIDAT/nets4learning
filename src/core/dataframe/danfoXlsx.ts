// xlsx para danfojs (vite.config.ts: danfoLazyDeps). danfo solo lo usa en readExcel y toExcel, que Nets4Learning no
// usa (lee CSV, ARFF, JSON, JSONL y Parquet), y sus 322 kB se descargaban en todas las páginas con dataframes.

const unavailable = () => {
  throw new Error('Excel files are not supported in Nets4Learning: use CSV, ARFF, JSON, JSONL or Parquet')
}

export const read = unavailable
export const writeFile = unavailable
export const utils = new Proxy({}, { get: () => unavailable })
