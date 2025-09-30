import { render, screen, waitFor } from "@testing-library/react";
import RepoFiles from "../pages/RepoFiles.jsx";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

vi.mock("axios");

describe("RepoFiles Component", () => {
  it("renders loading state", () => {
    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading files.../i)).toBeInTheDocument();
  });

  it("renders repo files", async () => {
    axios.get.mockResolvedValue({
      data: [{ name: "index.js", type: "file", size: 123, path: "index.js" }]
    });

    render(
      <MemoryRouter initialEntries={["/repo/testuser/testrepo/files"]}>
        <Routes>
          <Route path="/repo/:owner/:repo/files" element={<RepoFiles />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/index.js/)).toBeInTheDocument()
    );
  });
});
