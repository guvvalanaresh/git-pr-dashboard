import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});


const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Loading repositories/i)
    ).toBeInTheDocument();
  });

  it("renders data after fetch", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [{ id: 1, name: "repo1", owner: { login: "user1" }, stargazers_count: 10, watchers_count: 5 }] }) // repos
      .mockResolvedValueOnce({ data: { totalRepos: 1, totalStars: 10, totalForks: 2, followers: 5, following: 3 } }) // stats
      .mockResolvedValueOnce({ data: { username: "testuser", displayName: "Test User", avatar: "avatar.png" } }); // user

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for repo name
    await waitFor(() =>
      expect(screen.getByText(/repo1/)).toBeInTheDocument()
    );

    // Check stats and repos section
    // expect(screen.getAllByText(/Repositories/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Repositories/i).forEach(el => {
        expect(el).toBeInTheDocument();
    }));

    // Click on "View PRs" button
    fireEvent.click(screen.getByText(/View PRs/i));
    expect(mockNavigate).toHaveBeenCalledWith("/repo/user1/repo1");

    // Click on "View Files" button
    fireEvent.click(screen.getByText(/View Files/i));
    expect(mockNavigate).toHaveBeenCalledWith("/repo/user1/repo1/files");
  });

  it("handles logout", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // repos
      .mockResolvedValueOnce({ data: { totalRepos: 0, totalStars: 0, totalForks: 0, followers: 0, following: 0 } }) // stats
      .mockResolvedValueOnce({ data: { username: "testuser" } }); // user

    axios.post.mockResolvedValueOnce({}); // logout

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for user data
    await waitFor(() =>
      expect(screen.getAllByText(/testuser/i)[0]).toBeInTheDocument()
    );

    // Open dropdown (use first match)
    fireEvent.click(screen.getAllByText(/testuser/i)[0]);
    fireEvent.click(screen.getByText(/Logout/i));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/")
    );
  });

  it("shows error state", async () => {
    axios.get.mockRejectedValue(new Error("API failed"));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Failed to fetch data/i)).toBeInTheDocument()
    );
  });
});
