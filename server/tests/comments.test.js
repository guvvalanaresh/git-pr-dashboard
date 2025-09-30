import request from "supertest";
import express from "express";
import commentsRouter from "../routes/comments.js";

// Mock requireAuth from auth.js
jest.mock("../routes/auth.js", () => ({
  requireAuth: (req, res, next) => {
    req.user = { accessToken: "fake_token" }; // mock GitHub token
    next();
  }
}));

// Mock Octokit
jest.mock("@octokit/rest", () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        issues: {
          createComment: jest.fn().mockResolvedValue({
            data: {
              id: 101,
              body: "Test comment",
              user: { login: "testuser" },
              created_at: "2025-09-30T12:00:00Z"
            }
          }),
          listComments: jest.fn().mockResolvedValue({
            data: [
              { id: 101, body: "Test comment", user: { login: "testuser" }, created_at: "2025-09-30T12:00:00Z" }
            ]
          })
        }
      }
    }))
  };
});

const app = express();
app.use(express.json());
app.use("/api/repos", commentsRouter);

describe("Comments Routes", () => {
  const routeParams = "/api/repos/testOwner/testRepo/pulls/1/comments";

  it("POST /api/repos/:owner/:repo/pulls/:pull_number/comments should add a comment", async () => {
    const commentPayload = { body: "Test comment" };

    const res = await request(app)
      .post(routeParams)
      .send(commentPayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Comment added successfully");
    expect(res.body.comment.body).toBe(commentPayload.body);
    expect(res.body.comment.user.login).toBe("testuser");
  });

  it("POST /api/repos/:owner/:repo/pulls/:pull_number/comments should fail with empty body", async () => {
    const res = await request(app)
      .post(routeParams)
      .send({ body: "  " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Comment body is required");
  });

  it("GET /api/repos/:owner/:repo/pulls/:pull_number/comments should return comments", async () => {
    const res = await request(app).get(routeParams);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].body).toBe("Test comment");
    expect(res.body[0].user.login).toBe("testuser");
  });
});
