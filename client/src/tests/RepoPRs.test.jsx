import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RepoPRs from "../pages/RepoPRs";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

jest.mock("axios");

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe("RepoPRs Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading pull requests/i)).toBeInTheDocument();
  });

  it("renders PRs", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            number: 101,
            title: "Fix bug",
            state: "open",
            user: { login: "testuser" },
            comments: 2,
            created_at: new Date().toISOString(),
          },
        ],
      }) // pulls
      .mockResolvedValueOnce({ data: { default_branch: "main" } }); // branches

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Fix bug/i)).toBeInTheDocument()
    );
  });

  it("renders empty state when no PRs", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // pulls
      .mockResolvedValueOnce({ data: { default_branch: "main" } }); // branches

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pull requests/i)).toBeInTheDocument()
    );
    expect(
      screen.getByText(/doesn't have any pull requests/i)
    ).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API failed")); // pulls

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to fetch pull requests/i)
      ).toBeInTheDocument()
    );
  });

  it("handles branch API error gracefully", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // pulls
      .mockRejectedValueOnce(new Error("Branch API failed")); // branches

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pull requests/i)).toBeInTheDocument()
    );
  });

  it("submits a comment on a PR", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            number: 101,
            title: "Fix bug",
            state: "open",
            user: { login: "testuser" },
            comments: 2,
            created_at: new Date().toISOString(),
          },
        ],
      }) // pulls
      .mockResolvedValueOnce({ data: { default_branch: "main" } }); // branches

    axios.post.mockResolvedValueOnce({
      data: { id: 2001, body: "Hello from test!" },
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Fix bug/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/Fix bug/i));
    const textarea = await screen.findByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello from test!" } });
    const button = screen.getByRole("button", { name: /Submit Comment/i });
    fireEvent.click(button);

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/repos/testuser/testrepo/pulls/101/comments"
        ),
        { body: "Hello from test!" },
        expect.any(Object)
      )
    );
  });

  it("creates a new PR", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // pulls
      .mockResolvedValueOnce({
        data: { default_branch: "main", branches: [{ name: "feature-1" }] },
      }); // branches

    axios.post.mockResolvedValueOnce({
      data: { id: 123, title: "New Feature" },
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pull requests/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/New PR/i));

    const titleInput = await screen.findByPlaceholderText(/Add a title/i);
    fireEvent.change(titleInput, { target: { value: "New Feature" } });

    const headSelect = screen.getByDisplayValue(/Select head branch/i);
    fireEvent.change(headSelect, { target: {value: "feature-1"} });

    const bodyInput = screen.getByPlaceholderText(/Write a description/i);
    fireEvent.change(bodyInput, { target: { value: "This is a test PR" } });

    const createBtn = screen.getByRole("button", { name: /Create PR/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, payload] = axios.post.mock.calls[0];
      expect(url).toContain("/api/repos/testuser/testrepo/pulls");
      expect(payload).toMatchObject({
        title: "New Feature",
        head: "feature-1",
        base: "main",
        body: "This is a test PR",
      });
    });
  });

  it("toggles theme", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // pulls
      .mockResolvedValueOnce({ data: { default_branch: "main" } }); // branches

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pull requests/i)).toBeInTheDocument()
    );

    const toggleBtn = screen.getByTitle(/Switch to light mode/i);
    fireEvent.click(toggleBtn);

    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("navigates back to dashboard", async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] }) // pulls
      .mockResolvedValueOnce({ data: { default_branch: "main" } }); // branches

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pull requests/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText(/Back to Dashboard/i));

    expect(screen.getByText(/Dashboard Page/i)).toBeInTheDocument();
  });
});
