import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../pages/Login.jsx";

describe("Login Component", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.location;
    window.location = { href: "" };
  });

  it("renders login screen", () => {
    render(<Login />);
    expect(
      screen.getByRole("heading", { name: /GitHub PR Dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in with GitHub to view your repositories/i)
    ).toBeInTheDocument();
  });

  it("redirects to GitHub login when button is clicked", () => {
    render(<Login />);
    const loginButton = screen.getByRole("button", {
      name: /^Sign in with GitHub$/i, // button text only
    });
    fireEvent.click(loginButton);
    expect(window.location.href).toContain("/auth/github");
  });

  it("toggles theme when clicking theme button", () => {
    render(<Login />);
    const toggleButton = screen.getByTitle(/Switch to light mode/i);
    fireEvent.click(toggleButton);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
