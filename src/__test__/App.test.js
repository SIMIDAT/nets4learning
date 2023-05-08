import { render, screen } from '@testing-library/react';
import { BrowserRouter } from "react-router-dom";
import { renderWithRouter } from "./utils";
import TestPage from "../_TestPage";
import App from "../App";
import i18n from "../i18n";

describe('App', () => {

  beforeEach(async () => {
    await i18n.init();
  });

  test('renders TestPage', () => {
    render(<TestPage />, { wrapper: BrowserRouter })
    expect(screen.getByText(/TestPage/i)).toBeInTheDocument()
  });

  test('renders App', () => {
    renderWithRouter(<App />)
    expect(screen.getAllByText(/Nets4Learning/i)[0]).toBeInTheDocument()
  });

})