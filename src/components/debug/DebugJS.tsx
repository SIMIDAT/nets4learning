import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'

SyntaxHighlighter.registerLanguage('javascript', javascript)

type DebugJSProps = {
  code: string
}

export default function DebugJS ({ code }: DebugJSProps) {
  return <>
    <SyntaxHighlighter language="javascript" style={vs}>
      {code}
    </SyntaxHighlighter>
  </>
}