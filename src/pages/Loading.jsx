import { Container, Row, Col } from "react-bootstrap";

export default function Loading() {
  return <>
    <Container>
      <Row>
        <Col>
          <div className="d-flex vh-100 justify-content-center align-items-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className={"ms-3 mb-0"}>
              ...
            </h4>
          </div>
        </Col>
      </Row>
    </Container>
  </>
}