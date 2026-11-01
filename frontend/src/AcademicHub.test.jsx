import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

function jsonResponse(body, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => body });
}

const studentUser = {
  fullName: 'Chioma Okeke',
  email: 'cokeke@live.unilag.edu.ng',
  matricNumber: '190805123',
  level: '400L',
  role: 'student',
  verificationStatus: 'verified'
};

function setupFetchMocks(overrides = {}) {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/health')) return jsonResponse({ status: 'ok' });
    if (url.includes('/api/auth/me')) return jsonResponse({ success: true, user: studentUser });
    if (url.includes('/api/academic/current-period')) {
      return jsonResponse({
        success: true,
        period: { session: '2025/2026', semester: 'First Semester', sessions: ['2023/2024', '2024/2025', '2025/2026'] }
      });
    }
    if (url.includes('/api/academic/my-period')) {
      return jsonResponse({
        success: true,
        period: {
          _id: 'p1',
          currentLevel: '400L',
          session: '2025/2026',
          semester: 'First Semester',
          progressionHistory: [{ fromLevel: '300L', toLevel: '400L', session: '2024/2025', semester: 'Second Semester' }]
        }
      });
    }
    if (url.includes('/api/academic/courses')) {
      return jsonResponse({
        success: true,
        count: 2,
        courses: [
          { _id: 'c1', code: 'PHA401', title: 'Pharmacognosy IV', level: '400L', unit: 3 },
          { _id: 'c2', code: 'PHM402', title: 'Clinical Pharmacy II', level: '400L', unit: 2 }
        ]
      });
    }
    if (overrides[url]) return overrides[url];
    return Promise.reject(new Error(`Unknown url: ${url}`));
  });
}

describe('EPIC-004: Academic Hub (frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows the academic hub with live session, my record and course catalogue', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    setupFetchMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('user-session-badge')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-academic'));

    expect(await screen.findByTestId('academic-hub')).toBeInTheDocument();

    // Live university calendar from backend
    await waitFor(() => {
      expect(screen.getByTestId('current-period-section')).toHaveTextContent('2025/2026');
      expect(screen.getByTestId('current-period-section')).toHaveTextContent('First Semester');
    });

    // My academic record
    expect(screen.getByTestId('my-current-level')).toHaveTextContent('400L');
    expect(screen.getByTestId('progression-history')).toHaveTextContent('300L → 400L');

    // Course catalogue rendered from API data
    expect(screen.getByTestId('course-PHA401')).toHaveTextContent('Pharmacognosy IV');
    expect(screen.getByTestId('course-PHM402')).toBeInTheDocument();
  });

  it('filters courses client-side by search term', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    setupFetchMocks();

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-academic'));

    const searchInput = await screen.findByTestId('course-search-input');
    fireEvent.change(searchInput, { target: { value: 'clinical' } });

    await waitFor(() => {
      expect(screen.queryByTestId('course-PHA401')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('course-PHM402')).toBeInTheDocument();
  });

  it('saves academic period changes through the API', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    setupFetchMocks();

    const putResponse = jsonResponse({
      success: true,
      period: { _id: 'p1', currentLevel: '400L', session: '2024/2025', semester: 'Second Semester', progressionHistory: [] }
    });
    global.fetch.mockImplementation((url, options = {}) => {
      if (url.includes('/api/academic/my-period') && options.method === 'PUT') return putResponse;
      const fallback = {
        '/api/health': { status: 'ok' },
        '/api/auth/me': { success: true, user: studentUser }
      };
      for (const key of Object.keys(fallback)) {
        if (url.includes(key)) return jsonResponse(fallback[key]);
      }
      if (url.includes('/api/academic/current-period')) {
        return jsonResponse({ success: true, period: { session: '2025/2026', semester: 'First Semester', sessions: ['2024/2025', '2025/2026'] } });
      }
      if (url.includes('/api/academic/my-period')) {
        return jsonResponse({ success: true, period: { _id: 'p1', currentLevel: '400L', session: '2025/2026', semester: 'First Semester', progressionHistory: [] } });
      }
      if (url.includes('/api/academic/courses')) {
        return jsonResponse({ success: true, count: 0, courses: [] });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-academic'));

    await screen.findByTestId('period-update-form');
    fireEvent.change(screen.getByLabelText('Academic Session'), { target: { value: '2024/2025' } });
    fireEvent.change(screen.getByLabelText('Semester'), { target: { value: 'Second Semester' } });
    fireEvent.click(screen.getByTestId('save-period-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('academic-success-alert')).toHaveTextContent('saved');
    });

    const putCall = global.fetch.mock.calls.find(
      ([url, opts]) => url.includes('/api/academic/my-period') && opts?.method === 'PUT'
    );
    expect(putCall).toBeTruthy();
    expect(JSON.parse(putCall[1].body)).toEqual({ session: '2024/2025', semester: 'Second Semester' });
  });

  it('hides staff tools from regular students', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    setupFetchMocks();

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-academic'));

    await screen.findByTestId('academic-hub');
    expect(screen.queryByTestId('staff-academic-tools')).not.toBeInTheDocument();
  });
});
