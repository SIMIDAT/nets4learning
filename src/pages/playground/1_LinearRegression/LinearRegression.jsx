import { Form } from 'react-bootstrap'

export default function LinearRegression() {

  // TODO
  const handleSubmit_Play = async (event) => {
    event.preventDefault()
  }

  return (
    <>
      <Form onSubmit={handleSubmit_Play} id={"LinearRegression"}>
        <h1>LinearRegression Custom</h1>
      </Form>
    </>
  )
}