import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import React from 'react'

SyntaxHighlighter.registerLanguage('javascript', javascript)

export default function DebugJS ({ code }) {
  return <>
    <SyntaxHighlighter language="javascript" style={vs}>
      {code}
    </SyntaxHighlighter>
  </>
}