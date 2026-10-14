/** Las capas con la de `from` en el puesto `to`, las demás en su orden (para el editor de capas: subir y bajar) */
export function moveLayer<L>(layers: L[], from: number, to: number): L[] {
  if (from === to || from < 0 || to < 0 || from >= layers.length || to >= layers.length) return layers
  const next = [...layers]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
