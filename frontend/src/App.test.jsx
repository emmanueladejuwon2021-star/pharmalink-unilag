import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('Frontend Shell & Student Verification Flows (EPIC-003)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders student sign-in and switches tabs in plain non-technical language', async () => {
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
      expect(screen.getByTestId('api-status-online')).toHaveTextContent('PharmaLink Connected');
    });
  });

  it('allows student to navigate to Student Verification panel and view document upload form', async () => {
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
      if (url.includes('/api/verification/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            verificationStatus: 'unverified',
            request: null
          })
        });
      }
      if (url.includes('/api/verification/admin/requests')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            requests: []
          })
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-dashboard')).toBeInTheDocument();
    });

    // Click on Student Verification sidebar nav
    const verifyNav = screen.getByTestId('nav-verification');
    fireEvent.click(verifyNav);

    await waitFor(() => {
      expect(screen.getByTestId('verification-panel')).toBeInTheDocument();
      expect(screen.getByText(/To keep PharmaLink safe and exclusive/i)).toBeInTheDocument();
      expect(screen.getByTestId('verification-form')).toBeInTheDocument();
      expect(screen.getByText('Send for Review')).toBeInTheDocument();
    });
  });
});
