import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

const mockAnnouncements = [
  {
    _id: 'ann-1',
    title: 'PANS Annual Faculty Dinner & Awards',
    content: 'All pharmacy students are cordially invited to the 2024/2025 Faculty Dinner at Main Auditorium.',
    category: 'Events',
    priority: 'normal',
    targetLevels: ['All Levels'],
    isPinned: true,
    officialRole: 'PANS President',
    createdAt: new Date().toISOString(),
    author: {
      _id: 'u-pans-1',
      fullName: 'Babatunde Fashola',
      role: 'pans_exec'
    }
  },
  {
    _id: 'ann-2',
    title: 'Urgent: First Semester Continuous Assessment Timetable',
    content: 'Continuous assessments for 300L and 400L will commence next Monday across faculty lecture halls.',
    category: 'Academic',
    priority: 'urgent',
    targetLevels: ['300L', '400L'],
    isPinned: false,
    officialRole: 'Academic Committee Director',
    createdAt: new Date().toISOString(),
    author: {
      _id: 'u-pans-2',
      fullName: 'Chioma Okeke',
      role: 'pans_exec'
    }
  }
];

const mockNotifications = [
  {
    _id: 'notif-1',
    type: 'like',
    message: 'Chioma Okeke liked your pharmaceutics lab discussion.',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'notif-2',
    type: 'announcement',
    message: 'New PANS Official Notice: PANS Annual Faculty Dinner & Awards.',
    isRead: true,
    createdAt: new Date().toISOString()
  }
];

const mockSearchResults = {
  success: true,
  query: 'pharm',
  counts: { total: 3, posts: 1, materials: 1, students: 1 },
  results: {
    posts: [
      {
        _id: 'p-search-1',
        title: 'Pharmaceutics Physical Pharmacy Lab Report',
        content: 'Review colloidal dispersions and emulsion stability before practicals!',
        category: 'Lab & Practical',
        author: { fullName: 'Oluwaseun Adeleke' }
      }
    ],
    materials: [
      {
        _id: 'm-search-1',
        title: 'Pharmacokinetics Compartment Modeling Notes',
        courseCode: 'CPH 401',
        department: 'CPH',
        level: '400L',
        materialType: 'Lecture Note',
        downloadsCount: 15
      }
    ],
    students: [
      {
        _id: 's-search-1',
        fullName: 'Babatunde Fashola',
        level: '400L',
        department: 'Clinical Pharmacy',
        stats: { reputationPoints: 35 }
      }
    ]
  }
};

const mockAdminMetrics = {
  totalStudents: 142,
  verificationRate: 85,
  pendingVerifications: 3,
  totalPosts: 48,
  totalMaterials: 26,
  pendingReports: 2
};

const mockVerificationQueue = [
  {
    _id: 'req-1',
    fullName: 'Emeka Nwosu',
    matricNumber: '200805099',
    level: '200L',
    documentType: 'UNILAG Student ID Card',
    documentUrl: 'https://storage.unilag.edu.ng/verifications/emeka_id.jpg',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

const mockUsersList = [
  {
    _id: 'user-admin-1',
    fullName: 'Dr. Admin Pharmacist',
    matricNumber: '170805001',
    email: 'admin@live.unilag.edu.ng',
    level: '500L',
    role: 'admin',
    verificationStatus: 'verified',
    isSuspended: false
  },
  {
    _id: 'user-student-2',
    fullName: 'Ibrahim Musa',
    matricNumber: '200805055',
    email: 'imusa@live.unilag.edu.ng',
    level: '300L',
    role: 'student',
    verificationStatus: 'unverified',
    isSuspended: false
  }
];

const mockReportsQueue = [
  {
    _id: 'rep-1',
    contentType: 'post',
    contentId: 'p-violating-1',
    reason: 'misinformation',
    description: 'Incorrect dosage regimen stated for pediatric amoxicillin suspension.',
    status: 'pending',
    reporter: { fullName: 'Amina Bello' },
    createdAt: new Date().toISOString()
  }
];

function setupGrandFeaturesGlobalFetch(userOverrides = {}) {
  global.fetch = vi.fn().mockImplementation((url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const method = options.method || 'GET';

    if (urlStr.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', appName: 'BD-Pharm API' })
      });
    }

    if (urlStr.includes('/api/auth/me')) {
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
            role: 'student',
            verificationStatus: 'verified',
            ...userOverrides
          }
        })
      });
    }

    if (urlStr.includes('/api/notifications/unread-count')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, unreadCount: 1 })
      });
    }

    if (urlStr.includes('/api/notifications/mark-all-read')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'All notifications marked as read', modifiedCount: 1 })
      });
    }

    if (urlStr.includes('/api/notifications') && urlStr.includes('/read')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, unreadCount: 0 })
      });
    }

    if (urlStr.includes('/api/notifications')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notifications: mockNotifications, unreadCount: 1 })
      });
    }

    if (urlStr.includes('/api/search')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockSearchResults
      });
    }

    if (urlStr.includes('/api/announcements') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          announcement: {
            _id: 'ann-new',
            title: 'Test Published Notice',
            content: 'Notice content for students.',
            category: 'General',
            priority: 'normal',
            targetLevels: ['All Levels'],
            isPinned: false,
            createdAt: new Date().toISOString()
          }
        })
      });
    }

    if (urlStr.includes('/api/announcements')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, announcements: mockAnnouncements })
      });
    }

    if (urlStr.includes('/api/admin/metrics')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, metrics: mockAdminMetrics })
      });
    }

    if (urlStr.includes('/api/admin/verifications') && urlStr.includes('/approve')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Student verification approved' })
      });
    }

    if (urlStr.includes('/api/admin/verifications') && urlStr.includes('/reject')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Student verification rejected' })
      });
    }

    if (urlStr.includes('/api/admin/verifications')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, requests: mockVerificationQueue })
      });
    }

    if (urlStr.includes('/api/admin/users') && urlStr.includes('/role')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'User role updated' })
      });
    }

    if (urlStr.includes('/api/admin/users') && urlStr.includes('/suspend')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, isSuspended: true, message: 'User suspended' })
      });
    }

    if (urlStr.includes('/api/admin/users')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, users: mockUsersList })
      });
    }

    if (urlStr.includes('/api/reports') && urlStr.includes('/resolve')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Report resolved successfully' })
      });
    }

    if (urlStr.includes('/api/reports') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Report submitted successfully' })
      });
    }

    if (urlStr.includes('/api/reports')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, reports: mockReportsQueue })
      });
    }

    if (urlStr.includes('/api/posts')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, posts: [] })
      });
    }

    if (urlStr.includes('/api/materials')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, materials: [] })
      });
    }

    if (urlStr.includes('/api/verification/status')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, verificationStatus: userOverrides.verificationStatus || 'verified' })
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({ success: true })
    });
  });
}

describe('BD-Pharm Frontend Grand Features Suite (EPIC-013 to EPIC-017)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'test_jwt_token_123');
    vi.clearAllMocks();
  });

  // EPIC-013: Global Search and Discovery
  describe('EPIC-013: Global Search and Discovery Modal', () => {
    it('opens search modal from header button and executes real search', async () => {
      setupGrandFeaturesGlobalFetch({ verificationStatus: 'verified' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header-search-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('header-search-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-modal')).toBeInTheDocument();
        expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
      });

      // Type search query
      fireEvent.change(screen.getByTestId('global-search-input'), {
        target: { value: 'pharm' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('search-result-post-p-search-1')).toBeInTheDocument();
        expect(screen.getByTestId('search-result-material-m-search-1')).toBeInTheDocument();
        expect(screen.getByTestId('search-result-student-s-search-1')).toBeInTheDocument();
      });

      // Switch tab to Discussions
      fireEvent.click(screen.getByTestId('search-tab-posts'));
      expect(screen.getByTestId('search-result-post-p-search-1')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByTestId('close-search-btn'));
      await waitFor(() => {
        expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
      });
    });

    it('shows unverified preview barrier inside search modal for unverified students', async () => {
      setupGrandFeaturesGlobalFetch({ verificationStatus: 'unverified' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header-search-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('header-search-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-modal')).toBeInTheDocument();
        expect(screen.getByTestId('unverified-search-barrier')).toBeInTheDocument();
        expect(screen.getByText(/Unverified Student Preview/i)).toBeInTheDocument();
      });
    });
  });

  // EPIC-014: Notifications System
  describe('EPIC-014: Notifications System Modal', () => {
    it('renders unread badge and opens notifications modal', async () => {
      setupGrandFeaturesGlobalFetch();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header-notifications-btn')).toBeInTheDocument();
        expect(screen.getByTestId('unread-badge')).toHaveTextContent('1');
      });

      fireEvent.click(screen.getByTestId('header-notifications-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('notifications-modal')).toBeInTheDocument();
        expect(screen.getByTestId('notification-item-notif-1')).toBeInTheDocument();
        expect(screen.getByTestId('notification-item-notif-2')).toBeInTheDocument();
      });

      // Mark single notification read
      fireEvent.click(screen.getByTestId('notification-item-notif-1'));

      // Mark all read button
      expect(screen.getByTestId('mark-all-read-btn')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('mark-all-read-btn'));

      // Close modal
      fireEvent.click(screen.getByTestId('close-notifications-btn'));
      await waitFor(() => {
        expect(screen.queryByTestId('notifications-modal')).not.toBeInTheDocument();
      });
    });
  });

  // EPIC-015: Official PANS Announcements
  describe('EPIC-015: Official PANS Communication & Announcements', () => {
    it('navigates to PANS section and displays official announcements stream with categories', async () => {
      setupGrandFeaturesGlobalFetch({ verificationStatus: 'verified', role: 'student' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-pans')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('nav-pans'));

      await waitFor(() => {
        expect(screen.getByTestId('announcements-section')).toBeInTheDocument();
        expect(screen.getByTestId('announcement-card-ann-1')).toBeInTheDocument();
        expect(screen.getByTestId('announcement-card-ann-2')).toBeInTheDocument();
      });

      // Check pinned badge
      expect(screen.getByTestId('pinned-badge-ann-1')).toHaveTextContent(/PINNED/i);

      // Check category pills
      expect(screen.getByTestId('announcement-category-Events')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('announcement-category-Events'));
    });

    it('shows unverified status notice when unverified student visits PANS section', async () => {
      setupGrandFeaturesGlobalFetch({ verificationStatus: 'unverified' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-pans')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('nav-pans'));

      await waitFor(() => {
        expect(screen.getByTestId('unverified-announcements-notice')).toBeInTheDocument();
        expect(screen.getByText(/Student Verification Notice/i)).toBeInTheDocument();
      });
    });

    it('allows authorized PANS executive to open publish modal and create announcement', async () => {
      setupGrandFeaturesGlobalFetch({ verificationStatus: 'verified', role: 'pans_exec' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-pans')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('nav-pans'));

      await waitFor(() => {
        expect(screen.getByTestId('create-announcement-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('create-announcement-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('create-announcement-modal')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('announcement-title-input'), {
        target: { value: 'Mandatory Class Meeting for 300L' }
      });
      fireEvent.change(screen.getByTestId('announcement-content-input'), {
        target: { value: 'Attendance will be taken and forwarded to faculty board.' }
      });

      fireEvent.click(screen.getByTestId('submit-announcement-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('create-announcement-modal')).not.toBeInTheDocument();
      });
    });
  });

  // EPIC-016: Administration Console & Verification Queue
  describe('EPIC-016: Administration Console & Governance', () => {
    it('shows nav-admin for admin staff and displays metrics banner and verification queue', async () => {
      setupGrandFeaturesGlobalFetch({ role: 'admin', verificationStatus: 'verified' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('nav-admin'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-console')).toBeInTheDocument();
        expect(screen.getByTestId('admin-metrics-banner')).toBeInTheDocument();
        expect(screen.getByTestId('verification-item-req-1')).toBeInTheDocument();
      });

      // Approve verification
      fireEvent.click(screen.getByTestId('approve-verification-btn-req-1'));

      await waitFor(() => {
        expect(screen.getByTestId('admin-success')).toBeInTheDocument();
      });

      // Switch to User Governance tab
      fireEvent.click(screen.getByTestId('admin-tab-users'));
      await waitFor(() => {
        expect(screen.getByTestId('user-item-user-student-2')).toBeInTheDocument();
      });

      // Toggle user suspension
      fireEvent.click(screen.getByTestId('suspend-user-btn-user-student-2'));

      // Switch to Moderation Reports tab
      fireEvent.click(screen.getByTestId('admin-tab-reports'));
      await waitFor(() => {
        expect(screen.getByTestId('report-item-rep-1')).toBeInTheDocument();
      });

      // Remove violating content
      fireEvent.click(screen.getByTestId('remove-content-btn-rep-1'));
      await waitFor(() => {
        expect(screen.getByTestId('admin-success')).toBeInTheDocument();
      });
    });

    it('denies access to non-staff students attempting to view admin console', async () => {
      setupGrandFeaturesGlobalFetch({ role: 'student', verificationStatus: 'verified' });

      render(<App />);

      await waitFor(() => {
        // Non-staff should not have nav-admin
        expect(screen.queryByTestId('nav-admin')).not.toBeInTheDocument();
      });
    });
  });

  // Responsive Mobile Navigation Bar
  describe('Responsive Mobile Navigation Layout', () => {
    it('renders compact mobile bottom navigation bar with all core views', async () => {
      setupGrandFeaturesGlobalFetch({ role: 'pans_exec', verificationStatus: 'verified' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-nav-feed')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-nav-vault')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-nav-pans')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-nav-profile')).toBeInTheDocument();
      });

      // Navigate via mobile nav to PANS
      fireEvent.click(screen.getByTestId('mobile-nav-pans'));
      await waitFor(() => {
        expect(screen.getByTestId('announcements-section')).toBeInTheDocument();
      });
    });
  });
});
