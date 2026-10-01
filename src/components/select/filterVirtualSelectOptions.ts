export type VirtualSelectOption_t = { value: number, label: string }

// Para ordenar las coincidencias: "12" encuentra antes "#12 · …" que "#112 · …"
const withoutLeadingSymbols = (text: string) => text.replace(/^[^\p{L}\p{N}]+/u, '')

/** Opciones que contienen la búsqueda: primero las que empiezan por ella (sin contar símbolos iniciales como "#") */
export function filterVirtualSelectOptions(options: VirtualSelectOption_t[], query: string): VirtualSelectOption_t[] {
  const search = query.trim().toLowerCase()
  if (search === '') return options
  const starts: VirtualSelectOption_t[] = []
  const contains: VirtualSelectOption_t[] = []
  for (const option of options) {
    const label = option.label.toLowerCase()
    if (withoutLeadingSymbols(label).startsWith(withoutLeadingSymbols(search)) || label.startsWith(search)) starts.push(option)
    else if (label.includes(search)) contains.push(option)
  }
  return [...starts, ...contains]
}
