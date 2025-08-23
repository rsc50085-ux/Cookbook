import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "../pages/index";
vi.mock("@auth0/nextjs-auth0", () => ({ useUser: () => ({ user: null, isLoading: false }) }));
it("shows login link", () => {
  render(<Home />);
  expect(screen.getByText(/Login/)).toBeInTheDocument();
});


