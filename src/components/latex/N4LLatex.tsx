import "katex/dist/katex.min.css"
import Latex from "react-latex-next"

const LatexJSX = Latex as unknown as React.FC<{
  children   : React.ReactNode
  delimiters?: any[]
  strict?    : boolean
  macros?    : Record<string, string>
}>

export default function N4LLatex({ children }: { children: string }) {
  return <LatexJSX>{children}</LatexJSX>
}
