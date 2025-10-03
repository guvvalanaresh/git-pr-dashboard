import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

// Mock child pages so we can test routing cleanly
jest.mock("../pages/Login", () => () => <div>Login Page</div>);
jest.mock("../pages/Dashboard", () => () => <div>Dashboard Page</div>);
jest.mock("../pages/RepoPRs", () => () => <div>Repo PRs Page</div>);
jest.mock("../pages/RepoFiles", () => () => <div>Repo Files Page</div>);

describe("App Routing", () => {
  it("renders Login page at root path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders Dashboard page at /dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders RepoPRs page at /repo/:owner/:repo", () => {
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Repo PRs Page")).toBeInTheDocument();
  });

  it("renders RepoFiles page at /repo/:owner/:repo/files", () => {
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Repo Files Page")).toBeInTheDocument();
  });

  it("redirects unknown routes to Login page", () => {
    render(
      <MemoryRouter initialEntries={["/some/invalid/route"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
