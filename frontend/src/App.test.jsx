import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('Frontend Shell & Authentication Flows (EPIC-002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders sign-in form for unauthenticated users', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', appName: 'PharmaLink UNILAG API', uptimeSeconds: 15 })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    expect(screen.getByText('Student Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('tab-login')).toBeInTheDocument();
    expect(screen.getByTestId('tab-register')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('api-status-online')).toBeInTheDocument();
    });
  });

  it('can switch between Sign In and Register tabs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    });

    render(<App />);

    const registerTab = screen.getByTestId('tab-register');
    fireEvent.click(registerTab);

    expect(screen.getByText('Create Student Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/UNILAG Student Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Matric Number/i)).toBeInTheDocument();
  });

  it('renders authenticated dashboard when session is active', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok' })
        });
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              fullName: 'Chioma Okeke',
              email: 'cokeke@live.unilag.edu.ng',
              matricNumber: '190805123',
              level: '400L',
              role: 'student',
              verificationStatus: 'unverified'
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, Chioma Okeke!/i)).toBeInTheDocument();
      expect(screen.getByTestId('user-session-badge')).toBeInTheDocument();
    });
  });
});
