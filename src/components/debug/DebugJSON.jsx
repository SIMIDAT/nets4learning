import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import React from 'react'

SyntaxHighlighter.registerLanguage('json', json)

export default function DebugJSON ({ obj }) {
  return <>
    <SyntaxHighlighter language="json" style={vs}>
      {JSON.stringify(obj, null, '\t')}
    </SyntaxHighlighter>
  </>
}