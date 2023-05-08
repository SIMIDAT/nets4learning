import { render, screen } from "@testing-library/react";
import i18n from "../i18n";
import TabularClassificationModelReview from "../pages/playground/0_TabularClassification/TabularClassificationModelReview";
import { renderWithRouter } from "./utils";
// import TabularClassificationModelReview from "../pages/playground/0_TabularClassification/TabularClassificationModelReview";

describe('TabularClassification Review', () => {

  beforeEach(async () => {
    await i18n.init();
  });

  test('renders TabularClassification Review 0', () => {
    renderWithRouter(<TabularClassificationModelReview dataset="0" />)
    expect(screen.getAllByText(/pages.playground.0-tabular-classification.0_upload.upload-your-model/i)[0]).toBeInTheDocument()
  });

});

describe('TabularClassification Review 1', () => {

  beforeEach(async () => {
    await i18n.init();
  });

  test('renders TabularClassification Review 1', () => {
    renderWithRouter(<TabularClassificationModelReview dataset="1" />)
    expect(screen.getAllByText(/datasets-models.0-tabular-classification.car.title/i)[0]).toBeInTheDocument()
  });
});
