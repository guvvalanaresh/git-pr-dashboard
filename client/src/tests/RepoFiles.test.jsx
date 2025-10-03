import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RepoFiles from "../pages/RepoFiles.jsx";
import axios from "axios";

jest.mock("axios");

describe("RepoFiles Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading state", () => {
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading files/i)).toBeInTheDocument();
  });

  it("handles API error and retries", async () => {
    axios.get.mockRejectedValueOnce(new Error("API failed"));
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Failed to fetch repository files/i)
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("renders repository files", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        {
          name: "index.js",
          type: "file",
          size: 123,
          path: "index.js",
          html_url: "http://example.com/index.js",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('file-index.js')).toBeInTheDocument()
    );
  });

  it("renders empty state when no files", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No files found/i)).toBeInTheDocument()
    );
  });

  it("toggles theme", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No files found/i)).toBeInTheDocument()
    );

    const toggleBtn = screen.getByTitle(/Switch to light mode/i);
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("navigates back to repo overview", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
          <Route
            path="/repo/:owner/:repo"
            element={<div>Repo Overview</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No files found/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.getByText(/Repo Overview/i)).toBeInTheDocument();
  });
});
