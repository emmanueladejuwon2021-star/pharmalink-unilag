require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Material = require('../src/models/Material');
const Notification = require('../src/models/Notification');
const Announcement = require('../src/models/Announcement');
const Report = require('../src/models/Report');
const VerificationRequest = require('../src/models/VerificationRequest');
const { generateToken } = require('../src/utils/token');

jest.setTimeout(180000);

describe('EPIC-013 to EPIC-017 Core Operations & Governance API Suite', () => {
  let mongoServer;
  let adminToken;
  let studentToken;
  let unverifiedToken;
  let adminUser;
  let studentUser;
  let unverifiedUser;
  let testPost;
  let testMaterial;

  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
    let connected = false;
    if (testDbUri) {
      try {
        await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 5000 });
        connected = true;
      } catch (err) {
        console.warn('Remote MongoDB connection failed, falling back to MongoMemoryServer:', err.message);
      }
    }
    if (!connected) {
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
    }

    const timestamp = Date.now().toString().slice(-6);

    // Fast user creation directly via Mongoose
    studentUser = await User.create({
      fullName: `Chioma Adebayo ${timestamp}`,
      email: `chioma.${timestamp}@live.unilag.edu.ng`,
      matricNumber: `20040${timestamp.slice(0, 4)}`,
      level: '300L',
      password: 'StrongPassword123!',
      verificationStatus: 'verified',
      role: 'student'
    });
    studentToken = generateToken(studentUser);

    unverifiedUser = await User.create({
      fullName: `Femi Okafor ${timestamp}`,
      email: `femi.${timestamp}@live.unilag.edu.ng`,
      matricNumber: `21040${timestamp.slice(0, 4)}`,
      level: '200L',
      password: 'StrongPassword123!',
      verificationStatus: 'unverified',
      role: 'student'
    });
    unverifiedToken = generateToken(unverifiedUser);

    adminUser = await User.create({
      fullName: `Dean Admin ${timestamp}`,
      email: `admin.${timestamp}@unilag.edu.ng`,
      matricNumber: `19040${timestamp.slice(0, 4)}`,
      level: '500L',
      password: 'StrongPassword123!',
      verificationStatus: 'verified',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // Seed a Post for searching and reporting
    testPost = await Post.create({
      author: studentUser._id,
      content: `Understanding Pharmaceutical Dosage Formulations and Drug Delivery Systems in PCG 301`,
      category: 'Academic Discussion',
      targetLevel: '300L',
      tags: ['formulation', 'pharmaceutics', 'PCG301']
    });

    // Seed a Material for searching and reporting
    testMaterial = await Material.create({
      uploader: studentUser._id,
      title: `Comprehensive Pharmacognosy Lab Guide ${timestamp}`,
      description: 'Complete extraction methods and chromatography protocols',
      department: 'PCG',
      level: '300L',
      semester: 'First Semester',
      courseCode: 'PCG 301',
      materialType: 'Lab Resource',
      academicSession: '2024/2025',
      fileUrl: 'https://example.com/pharmacognosy-guide.pdf',
      fileName: 'pharmacognosy-guide.pdf',
      fileSize: 4096000
    });
  }, 180000);

  afterAll(async () => {
    try {
      if (studentUser) {
        await Post.deleteMany({ author: studentUser._id });
        await Material.deleteMany({ uploader: studentUser._id });
        await Notification.deleteMany({ recipient: studentUser._id });
        await Report.deleteMany({ reporter: studentUser._id });
        await User.findByIdAndDelete(studentUser._id);
      }
      if (unverifiedUser) {
        await VerificationRequest.deleteMany({ user: unverifiedUser._id });
        await User.findByIdAndDelete(unverifiedUser._id);
      }
      if (adminUser) {
        await Announcement.deleteMany({ author: adminUser._id });
        await User.findByIdAndDelete(adminUser._id);
      }
      await mongoose.disconnect();
      if (mongoServer) {
        await mongoServer.stop();
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }, 180000);

  describe('EPIC-013: Global Search and Discovery', () => {
    it('returns empty results when query is empty', async () => {
      const res = await request(app)
        .get('/api/search?q=')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.counts.total).toBe(0);
    });

    it('searches across posts, materials, and student directory with matching keywords', async () => {
      const res = await request(app)
        .get('/api/search?q=Pharmacognosy')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.counts.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.results.materials)).toBe(true);
    });

    it('respects type filter (e.g. type=materials)', async () => {
      const res = await request(app)
        .get('/api/search?q=Pharmacognosy&type=materials')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.results.posts.length).toBe(0);
      expect(res.body.results.materials.length).toBeGreaterThan(0);
    });
  });

  describe('EPIC-014: Notifications System', () => {
    let testNotificationId;

    it('manages notifications lifecycle and unread tracking', async () => {
      const notif = await Notification.create({
        recipient: studentUser._id,
        sender: adminUser._id,
        type: 'system',
        message: 'Welcome to BD-Pharm! Your account is active.'
      });
      testNotificationId = notif._id;

      // 1. Fetch notifications
      const resList = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resList.status).toBe(200);
      expect(resList.body.success).toBe(true);
      expect(resList.body.unreadCount).toBeGreaterThan(0);

      // 2. Fetch unread count badge
      const resCount = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resCount.status).toBe(200);
      expect(resCount.body.unreadCount).toBeGreaterThan(0);

      // 3. Mark single notification read
      const resRead = await request(app)
        .patch(`/api/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resRead.status).toBe(200);
      expect(resRead.body.notification.isRead).toBe(true);

      // 4. Mark all read
      const resAll = await request(app)
        .post('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resAll.status).toBe(200);
      expect(resAll.body.unreadCount).toBe(0);
    });
  });

  describe('EPIC-015: Official PANS Communication & Announcements', () => {
    let createdAnnouncementId;

    it('handles official announcements and permission gating', async () => {
      // 1. Student without executive role cannot publish announcement
      const resForbidden = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Student Announcement',
          content: 'This should fail because I am a regular student.',
          category: 'General'
        });

      expect(resForbidden.status).toBe(403);

      // 2. Admin or PANS executive can publish
      const resCreate = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Official PANS Annual Health Week & Symposium',
          content: 'Join us for the premier faculty event celebrating pharmaceutical innovation.',
          category: 'Events',
          priority: 'urgent',
          targetLevels: ['All Levels'],
          officialRole: 'PANS Executive Council'
        });

      expect(resCreate.status).toBe(201);
      expect(resCreate.body.announcement.title).toContain('Official PANS');
      createdAnnouncementId = resCreate.body.announcement._id;

      // 3. Fetch announcements
      const resList = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resList.status).toBe(200);
      expect(resList.body.announcements.length).toBeGreaterThan(0);

      // 4. Toggle pin status
      const resPin = await request(app)
        .post(`/api/announcements/${createdAnnouncementId}/pin`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resPin.status).toBe(200);
      expect(resPin.body.isPinned).toBe(true);
    });
  });

  describe('EPIC-016: Administration Dashboard & Verification Queue', () => {
    it('handles administrative overview, verification queue, and user roles', async () => {
      const reqDoc = await VerificationRequest.create({
        user: unverifiedUser._id,
        matricNumber: unverifiedUser.matricNumber,
        fullName: unverifiedUser.fullName,
        level: unverifiedUser.level,
        documentType: 'Faculty ID Card',
        documentUrl: 'https://example.com/id-card.jpg',
        status: 'pending'
      });

      // 1. Non-admin denied
      const resForbidden = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(resForbidden.status).toBe(403);

      // 2. Admin metrics
      const resMetrics = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resMetrics.status).toBe(200);
      expect(resMetrics.body.metrics.totalStudents).toBeGreaterThan(0);

      // 3. Verification queue
      const resQueue = await request(app)
        .get('/api/admin/verifications?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resQueue.status).toBe(200);
      expect(resQueue.body.requests.length).toBeGreaterThan(0);

      // 4. Approve verification
      const resApprove = await request(app)
        .post(`/api/admin/verifications/${reqDoc._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resApprove.status).toBe(200);
      expect(resApprove.body.verification.status).toBe('verified');

      // 5. Update user role
      const resRole = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'pans_exec' });
      expect(resRole.status).toBe(200);
      expect(resRole.body.user.role).toBe('pans_exec');
    });
  });

  describe('EPIC-017: Moderation and Content Reporting System', () => {
    it('manages content violation reporting and moderation enforcement', async () => {
      // 0. Unverified student cannot submit report
      const freshUnverified = await User.create({
        fullName: 'Unverified Reporter',
        email: `unverified.rep.${Date.now()}@live.unilag.edu.ng`,
        matricNumber: `23040${Date.now().toString().slice(-4)}`,
        level: '200L',
        password: 'StrongPassword123!',
        verificationStatus: 'unverified',
        role: 'student'
      });
      const freshUnverifiedToken = generateToken(freshUnverified);

      const resUnverified = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${freshUnverifiedToken}`)
        .send({
          contentType: 'post',
          contentId: testPost._id,
          reason: 'misinformation',
          description: 'Unverified attempt.'
        });
      expect(resUnverified.status).toBe(403);
      await User.findByIdAndDelete(freshUnverified._id);

      // 1. Submit report
      const resReport = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          contentType: 'post',
          contentId: testPost._id,
          reason: 'misinformation',
          description: 'The dosage calculation in this post is misleading.'
        });

      expect(resReport.status).toBe(201);
      expect(resReport.body.report.status).toBe('pending');
      const testReportId = resReport.body.report._id;

      // 2. Prevent duplicate pending report
      const resDup = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          contentType: 'post',
          contentId: testPost._id,
          reason: 'misinformation',
          description: 'Duplicate attempt.'
        });
      expect(resDup.status).toBe(409);

      // 3. View moderation reports
      const resQueue = await request(app)
        .get('/api/reports?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resQueue.status).toBe(200);
      expect(resQueue.body.reports.length).toBeGreaterThan(0);

      // 4. Resolve report with content removal
      const resResolve = await request(app)
        .patch(`/api/reports/${testReportId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          resolutionAction: 'content_removed',
          resolutionNotes: 'Post contained incorrect clinical information and has been removed.'
        });
      expect(resResolve.status).toBe(200);
      expect(resResolve.body.report.status).toBe('resolved');

      const post = await Post.findById(testPost._id);
      expect(post.isDeleted).toBe(true);
    });
  });
});
