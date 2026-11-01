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
      if (url.includes('/api/verification/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            verificationStatus: 'unverified',
            currentRequest: null
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
      expect(screen.getByTestId('verification-section')).toBeInTheDocument();
    });
  });
});

describe('Student Verification UI Flow (EPIC-003)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('displays verification submission form and unverified status banner', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'ok' }) });
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              fullName: 'Babatunde Adeleke',
              email: 'badeleke@live.unilag.edu.ng',
              matricNumber: '190805444',
              level: '300L',
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
            currentRequest: null
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-section')).toBeInTheDocument();
      expect(screen.getByTestId('verification-status-banner')).toHaveTextContent('UNVERIFIED');
      expect(screen.getByTestId('verification-form')).toBeInTheDocument();
      expect(screen.getByTestId('doc-type-select')).toBeInTheDocument();
    });
  });

  it('displays pending review state when document has been submitted', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'ok' }) });
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              fullName: 'Babatunde Adeleke',
              email: 'badeleke@live.unilag.edu.ng',
              matricNumber: '190805444',
              level: '300L',
              role: 'student',
              verificationStatus: 'pending'
            }
          })
        });
      }
      if (url.includes('/api/verification/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            verificationStatus: 'pending',
            currentRequest: {
              documentType: 'Faculty ID Card',
              fileName: 'faculty_id.png',
              createdAt: new Date().toISOString()
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-status-banner')).toHaveTextContent('PENDING');
      expect(screen.getByText(/Faculty ID Card/i)).toBeInTheDocument();
      expect(screen.getByText(/faculty_id.png/i)).toBeInTheDocument();
    });
  });

  it('displays administrator review queue tab for admin role', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'ok' }) });
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              fullName: 'Admin User',
              email: 'admin@live.unilag.edu.ng',
              matricNumber: '180805001',
              level: '500L',
              role: 'admin',
              verificationStatus: 'verified'
            }
          })
        });
      }
      if (url.includes('/api/verification/status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            verificationStatus: 'verified',
            currentRequest: null
          })
        });
      }
      if (url.includes('/api/verification/requests')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            requests: [
              {
                _id: 'req123',
                fullName: 'Applicant Student',
                matricNumber: '190805999',
                level: '200L',
                documentType: 'Docket / Exam Slip',
                createdAt: new Date().toISOString()
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('admin-tab-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('admin-queue-view')).toBeInTheDocument();
      expect(screen.getByText('Applicant Student')).toBeInTheDocument();
      expect(screen.getByTestId('approve-btn-req123')).toBeInTheDocument();
      expect(screen.getByTestId('reject-btn-req123')).toBeInTheDocument();
    });
  });
});
