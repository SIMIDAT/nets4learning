import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

export const renderWithRouter = (ui, {route = '/nets4learning'} = {}) => {
  window.history.pushState({}, 'Test page', route)
  return {
    user: userEvent.setup(),
    ...render(ui, {wrapper: BrowserRouter}),
  }
}