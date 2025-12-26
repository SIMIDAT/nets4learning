import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'

SyntaxHighlighter.registerLanguage('json', json)

type DebugJSONProps = {
  obj: unknown
}

export default function DebugJSON ({ obj }: DebugJSONProps) {
  return <>
    <SyntaxHighlighter language="json" style={vs}>
      {JSON.stringify(obj, null, '\t')}
    </SyntaxHighlighter>
  </>
}