import express from 'express';
import { Octokit } from '@octokit/rest';
import { requireAuth } from './auth.js';

const router = express.Router();

// Middleware to create authenticated Octokit instance
const createOctokit = (req, res, next) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.octokit = new Octokit({
    auth: req.user.accessToken,
  });
  
  next();
};

// Add comment to a pull request
router.post('/:owner/:repo/pulls/:pull_number/comments', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    // Add comment to the pull request
    const { data: comment } = await req.octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(pull_number),
      body: body.trim(),
    });

    res.json({
      message: 'Comment added successfully',
      comment: {
        id: comment.id,
        body: comment.body,
        user: comment.user,
        created_at: comment.created_at,
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    
    if (error.status === 403) {
      return res.status(403).json({ 
        error: 'Permission denied',
        message: 'You do not have permission to comment on this repository'
      });
    }
    
    if (error.status === 404) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Repository or pull request not found'
      });
    }

    res.status(500).json({ 
      error: 'Failed to add comment',
      message: error.message 
    });
  }
});

// Get comments for a pull request
router.get('/:owner/:repo/pulls/:pull_number/comments', requireAuth, createOctokit, async (req, res) => {
  try {
    const { owner, repo, pull_number } = req.params;
    
    const { data: comments } = await req.octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: parseInt(pull_number),
      per_page: 100,
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      message: error.message 
    });
  }
});

export default router;
