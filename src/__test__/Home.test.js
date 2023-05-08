import { render, screen } from "@testing-library/react";
import Home from "../pages/_home/Home";
import i18n from "../i18n";

describe('Home', () => {
  beforeEach(async () => {
    await i18n.init();
  });

  test('renders Home', () => {
    render(<Home />)
    expect(screen.getAllByText(/welcome/i)[0]).toBeInTheDocument()
  });
});