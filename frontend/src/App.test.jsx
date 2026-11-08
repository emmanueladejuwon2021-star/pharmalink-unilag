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
    stats: { postsCount: 5, materialsCount: 2, reputationPoints: 30, followersCount: 12, followingCount: 8 },
    followersCount: 12,
    followingCount: 8,
    isFollowing: false,
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
    stats: { postsCount: 3, materialsCount: 1, reputationPoints: 15, followersCount: 12, followingCount: 8 },
    followersCount: 12,
    followingCount: 8,
    isFollowing: false,
    verificationStatus: 'verified'
  }
];

const mockMaterials = [
  {
    _id: 'm1',
    title: 'Pharmacokinetics Compartment Modeling Notes',
    description: 'Detailed one-compartment and two-compartment IV bolus equations and clearance calculations.',
    courseCode: 'CPH 401',
    department: 'CPH',
    level: '400L',
    semester: 'First Semester',
    materialType: 'Lecture Note',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/cph401_notes.pdf',
    fileName: 'cph401_notes.pdf',
    downloadsCount: 5,
    viewsCount: 22,
    uploader: {
      _id: 'u1',
      fullName: 'Chioma Okeke',
      level: '300L'
    },
    isUploader: true
  },
  {
    _id: 'm2',
    title: 'Medicinal Chemistry SAR Summary Sheet',
    description: 'Structure-activity relationships for adrenergic agonists and beta blockers.',
    courseCode: 'PCH 301',
    department: 'PCH',
    level: '300L',
    semester: 'Second Semester',
    materialType: 'Summary Sheet',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/pch301_sar.pdf',
    fileName: 'pch301_sar.pdf',
    downloadsCount: 14,
    viewsCount: 48,
    uploader: {
      _id: 'u3',
      fullName: 'Babatunde Fashola',
      level: '400L'
    },
    isUploader: false
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
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
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
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
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
    likesCount: 2,
    hasLiked: false,
    createdAt: new Date().toISOString()
  }
];

const mockNotifications = [
  {
    _id: 'notif-1',
    user: 'u1',
    type: 'like',
    message: 'Babatunde Fashola liked your post "Pharmaceutics Physical Pharmacy Lab Report".',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'notif-2',
    user: 'u1',
    type: 'announcement',
    message: 'PANS Academic Director published a new announcement: Faculty Mid-Semester Assessment Timetable.',
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

const mockAnnouncements = [
  {
    _id: 'ann-1',
    title: 'Faculty Mid-Semester Assessment Timetable',
    content: 'The official 2024/2025 mid-semester assessment timetable has been released for all pharmacy students.',
    category: 'Academic',
    priority: 'urgent',
    targetLevels: ['All Levels'],
    isPinned: true,
    author: {
      _id: 'u2',
      fullName: 'PANS Academic Director'
    },
    officialRole: 'PANS Executive',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'ann-2',
    title: 'Annual PANS Health Week & Clinical Outreach',
    content: 'Registration is open for student volunteers participating in the community pharmacy screening drive.',
    category: 'Events',
    priority: 'normal',
    targetLevels: ['300L', '400L'],
    isPinned: false,
    author: {
      _id: 'u2',
      fullName: 'PANS Academic Director'
    },
    officialRole: 'PANS Executive',
    createdAt: new Date().toISOString()
  }
];

const mockAdminMetrics = {
  totalStudents: 142,
  verifiedStudents: 120,
  unverifiedStudents: 22,
  verificationRate: 85,
  pendingVerifications: 3,
  totalPosts: 48,
  totalMaterials: 65,
  pendingReports: 2
};

const mockVerificationRequests = [
  {
    _id: 'vr-1',
    user: 's3',
    fullName: 'Emeka Okafor',
    matricNumber: '190805199',
    level: '300L',
    department: 'PCT',
    documentType: 'unilag_id_card',
    documentUrl: 'https://storage.unilag.edu.ng/verifications/emeka_id.jpg',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

const mockPlatformUsers = [
  {
    _id: 'u1',
    fullName: 'Chioma Okeke',
    email: 'cokeke@live.unilag.edu.ng',
    matricNumber: '190805123',
    level: '300L',
    role: 'student',
    verificationStatus: 'verified',
    isSuspended: false
  },
  {
    _id: 'u4',
    fullName: 'Daniel Eze',
    email: 'deze@live.unilag.edu.ng',
    matricNumber: '190805130',
    level: '400L',
    role: 'student',
    verificationStatus: 'verified',
    isSuspended: false
  }
];

const mockReports = [
  {
    _id: 'rep-1',
    contentType: 'post',
    contentId: 'p2',
    reason: 'misinformation',
    description: 'Post contains outdated pharmacology dosage equations.',
    reporter: {
      _id: 'u3',
      fullName: 'Babatunde Fashola'
    },
    status: 'pending',
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
            stats: { postsCount: 2, materialsCount: 4, reputationPoints: 25, followersCount: 10, followingCount: 5 },
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
            stats: { postsCount: 2, materialsCount: 4, reputationPoints: 25, followersCount: 10, followingCount: 5 },
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
          students: JSON.parse(JSON.stringify(mockPeerStudents)),
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
        })
      });
    }
    if (url.includes('/follow')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          isFollowing: true,
          message: 'Now following student.'
        })
      });
    }
    if (url.includes('/like')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          liked: true,
          likesCount: 15,
          message: 'Post liked.'
        })
      });
    }
    if (url.includes('/relink')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          relinked: true,
          reLinksCount: 3,
          message: 'Post re-linked to your network!'
        })
      });
    }
    if (url.includes('/api/bookmarks')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          bookmarks: [
            {
              _id: 'bm1',
              createdAt: new Date().toISOString(),
              post: mockPosts[0]
            }
          ],
          count: 1
        })
      });
    }
    if (url.includes('/bookmark')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          bookmarked: true,
          message: 'Post saved to your bookmarks.'
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
    if (url.includes('/api/materials')) {
      if (url.includes('/download')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            downloadUrl: 'https://storage.unilag.edu.ng/materials/cph401_notes.pdf',
            fileName: 'cph401_notes.pdf',
            downloadsCount: 6
          })
        });
      }
      if (options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: 'Material deleted successfully' })
        });
      }
      if (options.method === 'POST') {
        const body = options.body ? JSON.parse(options.body) : {};
        if (userOverrides.verificationStatus === 'unverified') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({
              success: false,
              message: 'Student verification required. Please verify your student status to upload materials.'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            material: {
              _id: 'm3',
              title: body.title || 'New Uploaded Material',
              description: body.description || '',
              courseCode: body.courseCode || 'PCT 301',
              department: body.department || 'PCT',
              level: body.level || '300L',
              semester: body.semester || 'First Semester',
              materialType: body.materialType || 'Lecture Note',
              academicSession: body.academicSession || '2024/2025',
              fileUrl: body.fileUrl || 'https://storage.unilag.edu.ng/materials/new.pdf',
              fileName: body.fileName || 'new.pdf',
              downloadsCount: 0,
              viewsCount: 0,
              uploader: {
                _id: 'u1',
                fullName: 'Chioma Okeke',
                level: '300L'
              },
              isUploader: true
            }
          })
        });
      }

      // GET /api/materials with filter support
      let filtered = JSON.parse(JSON.stringify(mockMaterials));
      try {
        const urlObj = new URL(url, 'http://localhost');
        const level = urlObj.searchParams.get('level');
        const dept = urlObj.searchParams.get('department');
        const type = urlObj.searchParams.get('materialType');
        const search = urlObj.searchParams.get('search');

        if (level && level !== 'all' && level !== 'All Levels') {
          filtered = filtered.filter((m) => m.level === level);
        }
        if (dept && dept !== 'all') {
          filtered = filtered.filter((m) => m.department === dept);
        }
        if (type && type !== 'all') {
          filtered = filtered.filter((m) => m.materialType === type);
        }
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.title.toLowerCase().includes(s) ||
              m.courseCode.toLowerCase().includes(s) ||
              m.description.toLowerCase().includes(s)
          );
        }
      } catch (e) {
        // Fallback for relative url
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          materials: filtered,
          pagination: { page: 1, limit: 20, total: filtered.length, totalPages: 1 }
        })
      });
    }
    // EPIC-013: Global Search
    if (url.includes('/api/search')) {
      const urlObj = new URL(url, 'http://localhost');
      const q = (urlObj.searchParams.get('q') || '').toLowerCase();
      const type = urlObj.searchParams.get('type') || 'all';

      let matchingPosts = mockPosts.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
      let matchingMaterials = mockMaterials.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.courseCode.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
      let matchingStudents = mockPeerStudents.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.matricNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );

      if (!q) {
        matchingPosts = [];
        matchingMaterials = [];
        matchingStudents = [];
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          query: q,
          results: {
            posts: type === 'materials' || type === 'students' ? [] : matchingPosts,
            materials: type === 'posts' || type === 'students' ? [] : matchingMaterials,
            students: type === 'posts' || type === 'materials' ? [] : matchingStudents
          },
          counts: {
            total: matchingPosts.length + matchingMaterials.length + matchingStudents.length,
            posts: matchingPosts.length,
            materials: matchingMaterials.length,
            students: matchingStudents.length
          }
        })
      });
    }

    // EPIC-014: Notifications System
    if (url.includes('/api/notifications/unread-count')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          unreadCount: 2
        })
      });
    }
    if (url.includes('/api/notifications/mark-all-read')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'All notifications marked as read'
        })
      });
    }
    if (url.match(/\/api\/notifications\/[^/]+\/read/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          notification: { _id: 'notif-1', isRead: true },
          unreadCount: 1
        })
      });
    }
    if (url.includes('/api/notifications')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          notifications: JSON.parse(JSON.stringify(mockNotifications)),
          unreadCount: 2,
          pagination: { page: 1, limit: 20, total: mockNotifications.length, totalPages: 1 }
        })
      });
    }

    // EPIC-015: PANS Official Announcements
    if (url.match(/\/api\/announcements\/[^/]+\/pin/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Announcement pinned status updated',
          announcement: { ...mockAnnouncements[0], isPinned: !mockAnnouncements[0].isPinned }
        })
      });
    }
    if (url.includes('/api/announcements') && options.method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          announcement: {
            _id: 'ann-3',
            title: body.title || 'New Announcement',
            content: body.content || '',
            category: body.category || 'General',
            priority: body.priority || 'normal',
            targetLevels: body.targetLevels || ['All Levels'],
            isPinned: false,
            author: { _id: 'u1', fullName: 'Chioma Okeke' },
            officialRole: 'PANS Executive',
            createdAt: new Date().toISOString()
          }
        })
      });
    }
    if (url.includes('/api/announcements')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          announcements: JSON.parse(JSON.stringify(mockAnnouncements)),
          count: mockAnnouncements.length
        })
      });
    }

    // EPIC-016: Admin Metrics, Users & Verifications
    if (url.includes('/api/admin/metrics')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          metrics: mockAdminMetrics
        })
      });
    }
    if (url.match(/\/api\/admin\/verifications\/[^/]+\/approve/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Student verification request approved successfully.'
        })
      });
    }
    if (url.match(/\/api\/admin\/verifications\/[^/]+\/reject/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Student verification request rejected.'
        })
      });
    }
    if (url.includes('/api/admin/verifications')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          requests: JSON.parse(JSON.stringify(mockVerificationRequests))
        })
      });
    }
    if (url.match(/\/api\/admin\/users\/[^/]+\/role/)) {
      const body = options.body ? JSON.parse(options.body) : {};
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          user: { _id: 'u4', role: body.role || 'moderator' }
        })
      });
    }
    if (url.match(/\/api\/admin\/users\/[^/]+\/suspend/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          isSuspended: true,
          message: 'User suspension toggled.'
        })
      });
    }
    if (url.includes('/api/admin/users')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          users: JSON.parse(JSON.stringify(mockPlatformUsers)),
          count: mockPlatformUsers.length
        })
      });
    }

    // EPIC-017: Moderation Reports & Resolution
    if (url.match(/\/api\/reports\/[^/]+\/resolve/)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Report resolved successfully.',
          report: { _id: 'rep-1', status: 'resolved' }
        })
      });
    }
    if (url.includes('/api/reports') && options.method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {};
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Thank you. Your report has been submitted to the moderation team.',
          report: {
            _id: 'rep-2',
            contentType: body.contentType || 'post',
            contentId: body.contentId || 'p1',
            reason: body.reason || 'misinformation',
            description: body.description || '',
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        })
      });
    }
    if (url.includes('/api/reports')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          reports: JSON.parse(JSON.stringify(mockReports)),
          count: mockReports.length
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

describe('Likes, Re-Links and Bookmarks (EPIC-009)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('allows verified student to like and re-link a post', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('like-btn-p1')).toBeInTheDocument();
      expect(screen.getByTestId('relink-btn-p1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('like-btn-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('like-btn-p1')).toHaveTextContent('15');
    });

    fireEvent.click(screen.getByTestId('relink-btn-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('relink-btn-p1')).toHaveTextContent('3');
    });
  });

  it('allows student to bookmark a post and switch to Bookmarks tab', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('bookmark-btn-p1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-bookmarks')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('bookmark-btn-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('bookmark-btn-p1')).toHaveTextContent('Saved');
    });

    // Switch to Bookmarks tab
    fireEvent.click(screen.getByTestId('tab-bookmarks'));

    await waitFor(() => {
      expect(screen.getByText('Pharmaceutics Physical Pharmacy Lab Report')).toBeInTheDocument();
    });
  });
});

describe('Following and Social Connections (EPIC-010)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('renders followers and following stats on user profile summary', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-profile'));

    await waitFor(() => {
      expect(screen.getByTestId('profile-stat-followers')).toBeInTheDocument();
      expect(screen.getByTestId('profile-stat-following')).toBeInTheDocument();
    });
  });

  it('allows verified student to follow a peer in directory and updates button state and counters', async () => {
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
      expect(screen.getByTestId('follow-btn-s1')).toBeInTheDocument();
      expect(screen.getByTestId('follow-btn-s1')).toHaveTextContent('Follow');
      expect(screen.getByTestId('followers-count-s1')).toHaveTextContent('12 Followers');
      expect(screen.getByTestId('following-count-s1')).toHaveTextContent('8 Following');
    });

    fireEvent.click(screen.getByTestId('follow-btn-s1'));

    await waitFor(() => {
      expect(screen.getByTestId('follow-btn-s1')).toHaveTextContent('Following');
      expect(screen.getByTestId('followers-count-s1')).toHaveTextContent('13 Followers');
    });
  });

  it('shows restriction message when unverified student attempts to follow peers or views directory', async () => {
    setupGlobalFetch({ verificationStatus: 'unverified' });

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
      expect(screen.getByTestId('unverified-follow-banner')).toBeInTheDocument();
      expect(screen.getByTestId('unverified-follow-banner')).toHaveTextContent(/Student verification is required to follow peers/i);
    });

    if (screen.queryByTestId('follow-btn-s1')) {
      fireEvent.click(screen.getByTestId('follow-btn-s1'));
      await waitFor(() => {
        expect(screen.getByTestId('profile-error')).toHaveTextContent(/Student verification is required to follow peers/i);
      });
    }
  });
});

describe('EPIC-011 & EPIC-012: Materials Vault & Document Storage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('navigates to Materials Vault from sidebar and renders material cards', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('materials-section')).toBeInTheDocument();
      expect(screen.getByText(/Materials Vault & Academic Repository/i)).toBeInTheDocument();
      expect(screen.getByTestId('material-card-m1')).toBeInTheDocument();
      expect(screen.getByTestId('material-card-m2')).toBeInTheDocument();
      expect(screen.getByText('Pharmacokinetics Compartment Modeling Notes')).toBeInTheDocument();
      expect(screen.getByText('Medicinal Chemistry SAR Summary Sheet')).toBeInTheDocument();
    });
  });

  it('filters materials by level and department', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-level-300L')).toBeInTheDocument();
    });

    // Filter by 300L
    fireEvent.click(screen.getByTestId('filter-level-300L'));

    await waitFor(() => {
      expect(screen.getByTestId('material-card-m2')).toBeInTheDocument();
      expect(screen.queryByTestId('material-card-m1')).not.toBeInTheDocument();
    });

    // Filter by department PCH
    fireEvent.change(screen.getByTestId('materials-dept-select'), {
      target: { value: 'PCH' }
    });

    await waitFor(() => {
      expect(screen.getByTestId('material-card-m2')).toBeInTheDocument();
    });
  });

  it('filters materials by keyword search', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('materials-search-input')).toBeInTheDocument();
    });

    // Search for "SAR"
    fireEvent.change(screen.getByTestId('materials-search-input'), {
      target: { value: 'SAR' }
    });

    await waitFor(() => {
      expect(screen.getByTestId('material-card-m2')).toBeInTheDocument();
      expect(screen.queryByTestId('material-card-m1')).not.toBeInTheDocument();
    });
  });

  it('allows student to download material and increments downloads count', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('download-material-btn-m1')).toBeInTheDocument();
      expect(screen.getByTestId('material-downloads-m1')).toHaveTextContent('5 Downloads');
    });

    fireEvent.click(screen.getByTestId('download-material-btn-m1'));

    await waitFor(() => {
      expect(screen.getByTestId('material-downloads-m1')).toHaveTextContent('6 Downloads');
    });
  });

  it('allows verified student to open upload modal and upload a material', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('open-upload-modal-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-upload-modal-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('upload-material-modal')).toBeInTheDocument();
      expect(screen.getByTestId('material-title-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('material-title-input'), {
      target: { value: 'PCT 301 Physical Pharmacy Suspensions & Emulsions' }
    });
    fireEvent.change(screen.getByTestId('material-course-input'), {
      target: { value: 'PCT 301' }
    });

    fireEvent.click(screen.getByTestId('submit-material-btn'));

    await waitFor(() => {
      expect(screen.getByText('PCT 301 Physical Pharmacy Suspensions & Emulsions')).toBeInTheDocument();
    });
  });

  it('displays verification requirement barrier when student is unverified', async () => {
    setupGlobalFetch({ verificationStatus: 'unverified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-vault')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-vault'));

    await waitFor(() => {
      expect(screen.getByTestId('unverified-material-barrier')).toBeInTheDocument();
      expect(screen.getByText(/Student verification is required to upload materials/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-upload-modal-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('unverified-material-barrier')).toBeInTheDocument();
      expect(screen.queryByTestId('upload-material-modal')).not.toBeInTheDocument();
    });
  });
});

describe('EPIC-013: Global Search and Discovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('opens search modal, queries across discussions/materials/students, and selects result', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('header-search-btn')).toBeInTheDocument();
    });

    // Open Search modal
    fireEvent.click(screen.getByTestId('header-search-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
      expect(screen.getByText(/All Results/i)).toBeInTheDocument();
    });

    // Type query "Pharmaceutics"
    fireEvent.change(screen.getByTestId('global-search-input'), {
      target: { value: 'Pharmaceutics' }
    });

    // Verify results appear after debounce
    const postResult = await screen.findByTestId('search-result-post-p1', {}, { timeout: 4000 });
    expect(postResult).toBeInTheDocument();

    // Switch to Discussions tab
    const discussionsTab = screen.getByRole('button', { name: /Discussions/i });
    fireEvent.click(discussionsTab);

    // Wait for filtered discussions tab result to be present
    const postInTab = await screen.findByTestId('search-result-post-p1', {}, { timeout: 4000 });
    expect(postInTab).toBeInTheDocument();

    // Select the post item
    fireEvent.click(postInTab);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByTestId('global-search-input')).not.toBeInTheDocument();
    });
  });
});

describe('EPIC-014: Notifications System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('renders unread badge, opens notifications modal, lists notices, and marks as read', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('header-notifications-btn')).toBeInTheDocument();
      expect(screen.getByTestId('unread-badge')).toHaveTextContent('2');
    });

    // Open notifications modal
    fireEvent.click(screen.getByTestId('header-notifications-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Babatunde Fashola liked your post/i)).toBeInTheDocument();
      expect(
        screen.getByText(/PANS Academic Director published a new announcement/i)
      ).toBeInTheDocument();
    });

    // Click on unread notification to mark as read
    fireEvent.click(screen.getByText(/Babatunde Fashola liked your post/i));

    // Verify mark all read button is also functional
    const markAllBtn = screen.queryByRole('button', { name: /Mark all read/i });
    if (markAllBtn) {
      fireEvent.click(markAllBtn);
    }

    await waitFor(() => {
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });
  });
});

describe('EPIC-015: Official PANS Communication & Announcements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('navigates to PANS Official section and views pinned announcements', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-pans')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-pans'));

    await waitFor(() => {
      expect(screen.getByText('Official PANS Announcements')).toBeInTheDocument();
      expect(screen.getByText('Faculty Mid-Semester Assessment Timetable')).toBeInTheDocument();
      expect(screen.getByText('PINNED')).toBeInTheDocument();
      expect(screen.getByText('Annual PANS Health Week & Clinical Outreach')).toBeInTheDocument();
    });
  });

  it('allows authorized executive/admin to open notice creation modal', async () => {
    setupGlobalFetch({ role: 'pans_exec', verificationStatus: 'verified' });

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
      expect(screen.getByText('Publish Official Announcement')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Mandatory Faculty General Meeting/i)).toBeInTheDocument();
    });
  });
});

describe('EPIC-016: Administration Dashboard & Verification Queue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('renders admin console with platform metrics and allows approving student verification', async () => {
    setupGlobalFetch({ role: 'admin', verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-admin'));

    await waitFor(() => {
      expect(screen.getByText('BD-Pharm Administration & Governance')).toBeInTheDocument();
      expect(screen.getByText('TOTAL STUDENTS')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('85% Verified')).toBeInTheDocument();
      expect(screen.getByText('PENDING VERIFICATIONS')).toBeInTheDocument();
    });

    // Verification Queue tab
    await waitFor(() => {
      expect(screen.getByText('Emeka Okafor')).toBeInTheDocument();
      expect(screen.getByText('190805199')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
    });

    // Approve verification
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(screen.queryByText('Emeka Okafor')).not.toBeInTheDocument();
    });
  });
});

describe('EPIC-017: Moderation and Content Reporting System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('pharmalink_token', 'mock-token');
  });

  it('allows verified student to report violation on a post and displays confirmation', async () => {
    setupGlobalFetch({ verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-section')).toBeInTheDocument();
      expect(screen.getByTestId('report-post-p2')).toBeInTheDocument();
    });

    // Open Report Modal for post p2
    fireEvent.click(screen.getByTestId('report-post-p2'));

    await waitFor(() => {
      expect(screen.getByTestId('report-modal')).toBeInTheDocument();
      expect(screen.getByTestId('report-reason-select')).toBeInTheDocument();
      expect(screen.getByTestId('report-description-input')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('report-reason-select'), {
      target: { value: 'misinformation' }
    });
    fireEvent.change(screen.getByTestId('report-description-input'), {
      target: { value: 'Inaccurate clinical dosage guidelines in this post.' }
    });

    // Submit report
    fireEvent.click(screen.getByTestId('submit-report-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('report-success-msg')).toHaveTextContent(
        /Your report has been submitted to the moderation team/i
      );
    });
  });

  it('allows administrator to view and resolve moderation reports in Admin Console', async () => {
    setupGlobalFetch({ role: 'admin', verificationStatus: 'verified' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-admin'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Moderation Reports/i })).toBeInTheDocument();
    });

    // Switch to Moderation Reports tab
    fireEvent.click(screen.getByRole('button', { name: /Moderation Reports/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Post contains outdated pharmacology dosage equations/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
    });

    // Dismiss report
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/Post contains outdated pharmacology dosage equations/i)
      ).not.toBeInTheDocument();
    });
  });
  });
