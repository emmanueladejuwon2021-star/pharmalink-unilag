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

const mockPeerStudents = [
  {
    _id: 's1',
    fullName: 'Babatunde Fashola',
    matricNumber: '190805124',
    level: '400L',
    department: 'CPH',
    bio: 'Future Clinical Pharmacist',
    interests: ['Pharmacokinetics', 'Hospital Pharmacy'],
    stats: { postsCount: 5, materialsCount: 2, reputationPoints: 30 },
    verificationStatus: 'verified'
  },
  {
    _id: 's2',
    fullName: 'Amina Bello',
    matricNumber: '190805125',
    level: '300L',
    department: 'PCH',
    bio: 'Medicinal chemistry researcher',
    interests: ['Drug Discovery'],
    stats: { postsCount: 3, materialsCount: 1, reputationPoints: 15 },
    verificationStatus: 'verified'
  }
];

const mockPosts = [
  {
    _id: 'p1',
    title: 'Pharmaceutics Physical Pharmacy Lab Report',
    content: 'Review colloidal dispersions and emulsion stability before Wednesday practicals! #PCT301',
    category: 'Lab & Practical',
    level: '300L',
    department: 'PCT',
    courseCode: 'PCT 301',
    tags: ['pct301', 'pharmaceutics'],
    isPinned: true,
    likesCount: 14,
    repliesCount: 3,
    reLinksCount: 2,
    viewsCount: 45,
    isEdited: false,
    createdAt: new Date().toISOString(),
    author: {
      _id: 'u1',
      fullName: 'Oluwaseun Adeleke',
      level: '300L',
      department: 'PCT',
      verificationStatus: 'verified',
      role: 'student'
    },
    isAuthor: true
  },
  {
    _id: 'p2',
    title: 'Faculty Mid-Semester Timetable Update',
    content: 'Official PANS academic committee announcement regarding 400L clinical rotations.',
    category: 'PANS Official',
    level: 'All Levels',
    department: 'CPH',
    courseCode: null,
    tags: ['pans', 'updates'],
    isPinned: false,
    likesCount: 29,
    repliesCount: 6,
    reLinksCount: 5,
    viewsCount: 88,
    isEdited: false,
    createdAt: new Date().toISOString(),
    author: {
      _id: 'u2',
      fullName: 'PANS Academic Director',
      level: '500L',
      department: 'CPH',
      verificationStatus: 'verified',
      role: 'pans_exec'
    },
    isAuthor: false
  }
];

const mockComments = [
  {
    _id: 'cm1',
    post: 'p1',
    content: 'Emulsion stability requires surfactant HLB balance matching the oil phase.',
    author: {
      _id: 'u3',
      fullName: 'Babatunde Fashola',
      level: '400L',
      department: 'PCT',
      verificationStatus: 'verified',
      role: 'student'
    },
    isAuthor: false,
    isDeleted: false,
    createdAt: new Date().toISOString()
  }
];

function setupGlobalFetch(userOverrides = {}) {
  global.fetch = vi.fn().mockImplementation((url, options = {}) => {
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
            department: 'PCH',
            bio: 'Passionate pharmaceutical chemistry researcher',
            interests: ['Organic Synthesis', 'Medicinal Plants'],
            role: 'student',
            verificationStatus: 'unverified',
            stats: { postsCount: 2, materialsCount: 4, reputationPoints: 25 },
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
    if (url.includes('/api/profile/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            fullName: 'Chioma Okeke',
            email: 'cokeke@live.unilag.edu.ng',
            matricNumber: '190805123',
            level: '300L',
            department: 'PCH',
            bio: 'Passionate pharmaceutical chemistry researcher',
            interests: ['Organic Synthesis', 'Medicinal Plants'],
            role: 'student',
            verificationStatus: userOverrides.verificationStatus || 'unverified',
            stats: { postsCount: 2, materialsCount: 4, reputationPoints: 25 },
            ...userOverrides
          }
        })
      });
    }
    if (url.includes('/api/profile/directory/students')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          students: mockPeerStudents,
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
        })
      });
    }
    if (url.includes('/comments')) {
      if (options.method === 'POST') {
        const body = options.body ? JSON.parse(options.body) : {};
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            comment: {
              _id: 'cm2',
              post: 'p1',
              content: body.content || 'New discussion reply',
              author: {
                _id: 'u1',
                fullName: 'Chioma Okeke',
                level: '300L',
                department: 'PCH',
                verificationStatus: 'verified',
                role: 'student'
              },
              isAuthor: true,
              isDeleted: false,
              createdAt: new Date().toISOString()
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          comments: mockComments,
          count: mockComments.length
        })
      });
    }
    if (url.includes('/api/posts')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          posts: mockPosts,
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
        })
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

describe('User Profiles and Student Directory (EPIC-005)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('allows navigation to Student Profile from sidebar and displays user bio', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-profile'));

    await waitFor(() => {
      expect(screen.getByTestId('profile-section')).toBeInTheDocument();
      expect(screen.getByTestId('profile-bio-text')).toHaveTextContent('Passionate pharmaceutical chemistry researcher');
      expect(screen.getByTestId('tab-my-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tab-directory')).toBeInTheDocument();
    });
  });

  it('renders student directory peers when Directory tab is selected', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-profile'));

    await waitFor(() => {
      expect(screen.getByTestId('tab-directory')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-directory'));

    await waitFor(() => {
      expect(screen.getByText('Babatunde Fashola')).toBeInTheDocument();
      expect(screen.getByText('Amina Bello')).toBeInTheDocument();
      expect(screen.getByText('Future Clinical Pharmacist')).toBeInTheDocument();
    });
  });
});

describe('Social Feed and Post Management (EPIC-006 & EPIC-007)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('renders social feed with pinned posts and post cards', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-section')).toBeInTheDocument();
      expect(screen.getByText('Pharmaceutics Physical Pharmacy Lab Report')).toBeInTheDocument();
      expect(screen.getByText('PINNED ANNOUNCEMENT')).toBeInTheDocument();
      expect(screen.getByText('Faculty Mid-Semester Timetable Update')).toBeInTheDocument();
    });
  });

  it('displays post creator for verified students and opens creator box', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('create-post-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-post-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('post-creator-box')).toBeInTheDocument();
      expect(screen.getByTestId('post-content-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('submit-post-btn')).toBeInTheDocument();
    });
  });

  it('displays posting restriction banner when student is unverified', async () => {
    setupGlobalFetch({ verificationStatus: 'unverified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('unverified-feed-banner')).toBeInTheDocument();
      expect(screen.queryByTestId('create-post-btn')).not.toBeInTheDocument();
    });
  });
});

describe('Comments and Discussion Threads (EPIC-008)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('allows verified student to expand replies and submit a discussion reply', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-comments-p1')).toBeInTheDocument();
    });

    // Expand comments for post p1
    fireEvent.click(screen.getByTestId('toggle-comments-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('comments-section-p1')).toBeInTheDocument();
      expect(screen.getByText(/Emulsion stability requires surfactant HLB/i)).toBeInTheDocument();
      expect(screen.getByTestId('comment-input-p1')).toBeInTheDocument();
      expect(screen.getByTestId('submit-comment-btn-p1')).toBeInTheDocument();
    });

    // Submit new reply
    fireEvent.change(screen.getByTestId('comment-input-p1'), {
      target: { value: 'Also remember Bancroft rule for phase determination.' }
    });
    fireEvent.click(screen.getByTestId('submit-comment-btn-p1'));

    await waitFor(() => {
      expect(screen.getByText('Also remember Bancroft rule for phase determination.')).toBeInTheDocument();
    });
  });

  it('shows verification restriction banner inside comments when student is unverified', async () => {
    setupGlobalFetch({ verificationStatus: 'unverified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-comments-p1')).toBeInTheDocument();
    });

    // Expand comments
    fireEvent.click(screen.getByTestId('toggle-comments-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('comments-section-p1')).toBeInTheDocument();
      expect(screen.getByTestId('comment-unverified-prompt-p1')).toBeInTheDocument();
      expect(screen.queryByTestId('comment-input-p1')).not.toBeInTheDocument();
    });
  });
});
