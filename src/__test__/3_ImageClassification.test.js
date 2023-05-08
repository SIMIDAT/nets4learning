import { render, screen } from "@testing-library/react";
import i18n from "../i18n";
import ImageClassificationModelReview from "../pages/playground/3_ImageClassification/ImageClassificationModelReview";

class ResizeObserver {
  disconnect() {
  }

  observe() {
  }

  unobserve() {
  }
}

describe('ImageClassification', () => {

  window.ResizeObserver = ResizeObserver;

  beforeEach(async () => {
    await i18n.init();
  });

  test('renders ImageClassification Review', () => {
    render(<ImageClassificationModelReview dataset={"1"} />)
    expect(screen.getAllByText(/datasets-models.3-image-classifier.mnist.title/i)[0]).toBeInTheDocument()
  });

});
