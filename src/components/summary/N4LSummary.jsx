import React from 'react'

export default function N4LSummary ({ title, info, children }) {
  return <>
    <details>
      <summary className={'n4l-summary-1-25'}>{title}</summary>
      <main>{info} {children}</main>
    </details>
  </>
}
