import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

const mockAcademicSession = {
  name: '2024/2025',
  currentSemester: 'First Semester',
  isCurrent: true
};

const mockDepartments = [
  { code: 'CPH', name: 'Clinical Pharmacy and Biopharmacy', courseCount: 2 },
  { code: 'PCH', name: 'Pharmaceutical Chemistry', courseCount: 3 },
  { code: 'PCT', name: 'Pharmaceutics and Pharmaceutical Technology', courseCount: 2 },
  { code: 'PCG', name: 'Pharmacognosy', courseCount: 1 },
  { code: 'PCL', name: 'Pharmacology, Therapeutics and Toxicology', courseCount: 2 }
];

const mockCourses = [
  {
    _id: 'c1',
    code: 'PCH 301',
    title: 'Medicinal Chemistry I',
    department: 'PCH',
    level: '300L',
    semester: 'First Semester',
    units: 3,
    description: 'Structure-activity relationships of drugs.'
  },
  {
    _id: 'c2',
    code: 'CPH 401',
    title: 'Clinical Pharmacokinetics',
    department: 'CPH',
    level: '400L',
    semester: 'Second Semester',
    units: 3,
    description: 'Therapeutic drug monitoring principles.'
  }
];

function setupGlobalFetch(userOverrides = {}) {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', appName: 'BD-Pharm API', uptimeSeconds: 15 })
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
            level: '300L',
            role: 'student',
            verificationStatus: 'unverified',
            ...userOverrides
          }
        })
      });
    }
    if (url.includes('/api/verification/status')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          verificationStatus: userOverrides.verificationStatus || 'unverified',
          currentRequest: null
        })
      });
    }
    if (url.includes('/api/academic/departments')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, departments: mockDepartments })
      });
    }
    if (url.includes('/api/academic/sessions/current')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, session: mockAcademicSession })
      });
    }
    if (url.includes('/api/academic/courses')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, courses: mockCourses, count: mockCourses.length })
      });
    }
    return Promise.reject(new Error(`Unknown url: ${url}`));
  });
}

describe('Frontend Shell & Authentication Flows (EPIC-002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders sign-in form for unauthenticated users', async () => {
    setupGlobalFetch();
    render(<App />);

    expect(screen.getByText('Student Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('tab-login')).toBeInTheDocument();
    expect(screen.getByTestId('tab-register')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('api-status-online')).toBeInTheDocument();
      expect(screen.getByText('BD-Pharm')).toBeInTheDocument();
    });
  });

  it('can switch between Sign In and Register tabs', async () => {
    setupGlobalFetch();
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
    setupGlobalFetch();

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
    setupGlobalFetch({ verificationStatus: 'unverified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-section')).toBeInTheDocument();
      expect(screen.getByTestId('verification-status-banner')).toHaveTextContent('UNVERIFIED');
      expect(screen.getByTestId('verification-form')).toBeInTheDocument();
      expect(screen.getByTestId('doc-type-select')).toBeInTheDocument();
    });
  });

  it('displays administrator review queue tab for admin role', async () => {
    setupGlobalFetch({ role: 'admin', verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-btn')).toBeInTheDocument();
    });
  });
});

describe('Academic Structure & Course Catalog (EPIC-004)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('renders academic structure section with active session and departments', async () => {
    setupGlobalFetch();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('academic-section')).toBeInTheDocument();
      expect(screen.getByTestId('current-session-badge')).toHaveTextContent('2024/2025');
      expect(screen.getByTestId('current-session-badge')).toHaveTextContent('First Semester');
      expect(screen.getByTestId('dept-card-PCH')).toBeInTheDocument();
      expect(screen.getByTestId('dept-card-CPH')).toBeInTheDocument();
    });
  });

  it('displays courses list with course code and credit units', async () => {
    setupGlobalFetch();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('course-card-PCH 301')).toBeInTheDocument();
      expect(screen.getByText('Medicinal Chemistry I')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-CPH 401')).toBeInTheDocument();
      expect(screen.getByText('Clinical Pharmacokinetics')).toBeInTheDocument();
    });
  });

  it('allows navigation to Levels & Courses from sidebar', async () => {
    setupGlobalFetch();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-levels')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-levels'));

    await waitFor(() => {
      expect(screen.getByTestId('academic-section')).toBeInTheDocument();
    });
  });
});
