import { Form } from 'react-bootstrap'

export default function LinearRegressionModelReview() {

  // TODO
  const handleSubmit_Play = async (event) => {
    event.preventDefault()
  }

  return (
    <>
      <Form onSubmit={handleSubmit_Play} id={"LinearRegressionModelReview"}>
        <h1>LinearRegression Review</h1>
      </Form>
    </>
  )
}