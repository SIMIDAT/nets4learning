
export default function WaitingCircle () {
  return <>
    <div className="spinner-border"
         role="status"
         style={{
           fontSize: '0.5em',
           height  : '1rem',
           width   : '1rem',
         }}>
      <span className="sr-only"></span>
    </div>
  </>
}