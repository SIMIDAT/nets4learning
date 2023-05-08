import { render, screen } from "@testing-library/react";
import i18n from "../i18n";
import ObjectDetectionModelReview from "../pages/playground/2_ObjectDetection/ObjectDetectionModelReview";
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";

// describe('ObjectDetection', () => {
//   beforeEach(async () => {
//     await i18n.init();
//   });
// });

describe('ObjectDetection 1', () => {

  test('renders ObjectDetection Review | Face detection', () => {
    render(<ObjectDetectionModelReview dataset={"1"} />)
    expect(screen.getAllByText(/datasets-models.2-object-detection.face-detection.title/i)[0]).toBeInTheDocument()
  });

});

describe('ObjectDetection 2', () => {

  test('renders ObjectDetection Review | Face Mesh', () => {
    render(<ObjectDetectionModelReview dataset={"2"} />)
    expect(screen.getAllByText(/datasets-models.2-object-detection.face-mesh.title/i)[0]).toBeInTheDocument()
  });

});

describe('ObjectDetection 3', () => {

  test('renders ObjectDetection Review | MoveNetPoseNet ', () => {
    render(<ObjectDetectionModelReview dataset={"3"} />)
    expect(screen.getAllByText(/datasets-models.2-object-detection.move-net--pose-net.title/i)[0]).toBeInTheDocument()
  });

});

describe('ObjectDetection 4', () => {

  test('renders ObjectDetection Review | COCO SSD ', () => {
    render(<ObjectDetectionModelReview dataset={"4"} />)
    expect(screen.getAllByText(/datasets-models.2-object-detection.coco-ssd.title/i)[0]).toBeInTheDocument()
  });

});
