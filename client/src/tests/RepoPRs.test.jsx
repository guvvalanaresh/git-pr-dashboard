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
    expect(
      screen.getByText(/Loading pull requests/i)
    ).toBeInTheDocument();
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

  it("renders empty state", async () => {
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
      expect(
        screen.getByText(/No pull requests/i)
      ).toBeInTheDocument()
    );

    expect(
      screen.getByText(/doesn't have any pull requests/i)
    ).toBeInTheDocument();
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
});
