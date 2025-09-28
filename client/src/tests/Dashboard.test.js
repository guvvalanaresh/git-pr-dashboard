import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../pages/Dashboard';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
  });

  test('renders repositories correctly', async () => {
    const mockRepos = [
      {
        id: 1,
        name: 'test-repo',
        owner: { login: 'testuser' },
        description: 'A test repository',
        language: 'JavaScript',
        stargazers_count: 10,
        watchers_count: 5,
        private: false
      },
      {
        id: 2,
        name: 'private-repo',
        owner: { login: 'testuser' },
        description: 'A private repository',
        language: 'TypeScript',
        stargazers_count: 0,
        watchers_count: 1,
        private: true
      }
    ];

    mockedAxios.get.mockResolvedValue({ data: mockRepos });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Your Repositories')).toBeInTheDocument();
      expect(screen.getByText('test-repo')).toBeInTheDocument();
      expect(screen.getByText('private-repo')).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch repositories')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  test('renders empty state when no repositories', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No repositories found')).toBeInTheDocument();
    });
  });

  test('handles logout', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({});

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      logoutButton.click();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      {},
      { withCredentials: true }
    );
  });
});
