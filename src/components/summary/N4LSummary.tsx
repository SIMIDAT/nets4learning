
/**
 * @typedef {Object} N4LSummaryProps
 * @property {React.JSX.Element|string} title
 * @property {React.JSX.Element|string} [info=<></>]
 * @property {React.ReactNode} [children=<></>]
 */
type N4LSummaryProps = {
  title    : React.JSX.Element | string;
  info?    : React.JSX.Element | string;
  children?: React.ReactNode;
}
/** 
 * 
 * @param {N4LSummaryProps} N4LSummaryProps
 * @returns 
 */
export default function N4LSummary ({ title, info=<></>, children=<></> }: N4LSummaryProps) {
  return <>
    <details>
      <summary className={'n4l-summary-1-25'}>{title}</summary>
      <main>{info} {children}</main>
    </details>
  </>
}
