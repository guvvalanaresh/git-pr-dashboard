import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RepoPRs from "../pages/RepoPRs.jsx";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

describe("RepoPRs Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          number: 101,
          title: "Fix bug",
          state: "open",
          user: { login: "testuser" },
          comments: 2,
          created_at: new Date().toISOString()
        }
      ]
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Fix bug/)).toBeInTheDocument()
    );
  });

  it("submits a comment on a PR", async () => {
    // Mock GET PRs
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          number: 101,
          title: "Fix bug",
          state: "open",
          user: { login: "testuser" },
          comments: 2,
          created_at: new Date().toISOString()
        }
      ]
    });

    // Mock POST comment
    axios.post.mockResolvedValue({
      data: { id: 2001, body: "Hello from test!" }
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/prs"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/prs" element={<RepoPRs />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for PRs to load
    await waitFor(() =>
      expect(screen.getByText(/Fix bug/)).toBeInTheDocument()
    );

    // Find comment textarea and button
    const textarea = await screen.findByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello from test!" } });

    const button = screen.getByRole("button", { name: /Submit Comment/i });
    fireEvent.click(button);

    // Check if axios.post was called with correct data
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/repos/testuser/testrepo/pulls/101/comment",
        { body: "Hello from test!" }
      )
    );
  });
});
