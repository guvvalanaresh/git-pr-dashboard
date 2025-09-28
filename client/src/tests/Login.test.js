import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock the environment variable
const mockEnv = {
  VITE_API_URL: 'http://localhost:3001'
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    // Reset window.location.href before each test
    window.location.href = '';
  });

  test('renders login form correctly', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByText('GitHub PR Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sign in with GitHub')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with GitHub to view your repositories/)).toBeInTheDocument();
  });

  test('handles GitHub login button click', () => {
    renderWithRouter(<Login />);
    
    const loginButton = screen.getByText('Sign in with GitHub');
    fireEvent.click(loginButton);
    
    expect(window.location.href).toBe('http://localhost:3001/auth/github');
  });

  test('displays GitHub icon', () => {
    renderWithRouter(<Login />);
    
    // Check for GitHub icon (Lucide React icon)
    const githubIcons = screen.getAllByTestId('github-icon');
    expect(githubIcons.length).toBeGreaterThan(0);
  });

  test('has proper styling classes', () => {
    renderWithRouter(<Login />);
    
    const card = screen.getByRole('generic', { name: /card/i });
    expect(card).toHaveClass('github-card');
    
    const button = screen.getByText('Sign in with GitHub');
    expect(button).toHaveClass('github-button');
  });
});
