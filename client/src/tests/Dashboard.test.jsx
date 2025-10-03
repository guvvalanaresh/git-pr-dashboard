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
    expect(screen.getByText(/Loading repositories/i)).toBeInTheDocument();
  });

  it("renders data after fetch and handles navigation", async () => {
    // Mock API responses
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: "repo1",
            owner: { login: "user1" },
            stargazers_count: 10,
            watchers_count: 5,
            language: "JavaScript",
            private: true,
          },
        ],
      }) // repos
      .mockResolvedValueOnce({
        data: { totalRepos: 1, totalStars: 10, totalForks: 2, followers: 5, following: 3 },
      }) // stats
      .mockResolvedValueOnce({
        data: { username: "testuser", displayName: "Test User", avatar: "avatar.png" },
      }); // user

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for repository name to appear
    await waitFor(() => expect(screen.getByText(/repo1/i)).toBeInTheDocument());

    // Check stats cards (pick first match if multiple)
    const statsTexts = ["Repositories", "Total Stars", "Total Forks", "Followers", "Following"];
    statsTexts.forEach((text) => {
      const element = screen.getAllByText(new RegExp(text, "i"))[0];
      expect(element).toBeInTheDocument();
    });

    // Check repo action buttons
    fireEvent.click(screen.getByText(/View PRs/i));
    expect(mockNavigate).toHaveBeenCalledWith("/repo/user1/repo1");

    fireEvent.click(screen.getByText(/View Files/i));
    expect(mockNavigate).toHaveBeenCalledWith("/repo/user1/repo1/files");

    // Check private badge
    expect(screen.getByText(/Private/i)).toBeInTheDocument();
  });

  it("handles empty repositories and fallback UI", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // repos
      .mockResolvedValueOnce({
        data: { totalRepos: 0, totalStars: 0, totalForks: 0, followers: 0, following: 0 },
      }) // stats
      .mockResolvedValueOnce({ data: { username: "testuser" } }); // user

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No repositories found/i)).toBeInTheDocument());
  });

  it("handles profile dropdown and logout", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // repos
      .mockResolvedValueOnce({
        data: { totalRepos: 0, totalStars: 0, totalForks: 0, followers: 0, following: 0 },
      }) // stats
      .mockResolvedValueOnce({ data: { username: "testuser", displayName: "Test User" } }); // user

    axios.post.mockResolvedValueOnce({}); // logout

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for username
    await waitFor(() => expect(screen.getAllByText(/testuser/i)[0]).toBeInTheDocument());

    // Open profile dropdown
    const usernameElement = screen.getAllByText(/testuser/i)[0];
    fireEvent.click(usernameElement);

    // Click logout
    fireEvent.click(screen.getByText(/Logout/i));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("shows error state on fetch failure and retries", async () => {
    axios.get.mockRejectedValue(new Error("API failed"));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Failed to fetch data/i)).toBeInTheDocument());

    // Retry button click triggers 3 more API calls
    fireEvent.click(screen.getByText(/Try Again/i));
    expect(axios.get).toHaveBeenCalledTimes(6);
  });

  it("toggles theme", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // repos
      .mockResolvedValueOnce({
        data: { totalRepos: 0, totalStars: 0, totalForks: 0, followers: 0, following: 0 },
      }) // stats
      .mockResolvedValueOnce({ data: { username: "testuser" } }); // user

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No repositories found/i)).toBeInTheDocument());

    const toggleBtn = screen.getByTitle(/Switch to light mode/i);
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
