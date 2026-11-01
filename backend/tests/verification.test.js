require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const VerificationRequest = require('../src/models/VerificationRequest');
const { USER_ROLES, VERIFICATION_STATUS } = require('@pharmalink/shared');
const { requireAuth, requireVerified } = require('../src/middleware/authMiddleware');

jest.setTimeout(35000);



let mongoServer;
const testDbUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (testDbUri) {
    await mongoose.connect(testDbUri);
  } else {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
}, 60000);

afterAll(async () => {
  await VerificationRequest.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await VerificationRequest.deleteMany({});
  await User.deleteMany({});
});

describe('EPIC-003: Student Verification System API', () => {
  async function setupUsers() {
    const studentRes = await request(app).post('/api/auth/register').send({
      fullName: 'Babatunde Fashola',
      email: 'bfashola@live.unilag.edu.ng',
      matricNumber: '190805123',
      level: '400L',
      password: 'StrongPassword123!'
    });

    const adminRes = await request(app).post('/api/auth/register').send({
      fullName: 'PANS Administrator',
      email: 'admin@live.unilag.edu.ng',
      matricNumber: '180805001',
      level: '500L',
      password: 'AdminPassword123!'
    });

    await User.findByIdAndUpdate(adminRes.body.user._id, { role: USER_ROLES.ADMIN });

    return {
      studentToken: studentRes.body.token,
      studentUser: studentRes.body.user,
      adminToken: adminRes.body.token,
      adminUser: adminRes.body.user
    };
  }

  describe('POST /api/verification/submit', () => {
    it('successfully submits verification request with valid document', async () => {
      const { studentToken, studentUser } = await setupUsers();

      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          fileName: 'faculty_id_card.png',
          fileSize: 1024
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationRequest).toMatchObject({
        matricNumber: '190805123',
        level: '400L',
        documentType: 'Faculty ID Card',
        status: VERIFICATION_STATUS.PENDING
      });

      // Verify user's verificationStatus updated to pending
      const updatedUser = await User.findById(studentUser._id);
      expect(updatedUser.verificationStatus).toBe(VERIFICATION_STATUS.PENDING);
    });

    it('rejects submission with invalid document type', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'International Passport',
          documentUrl: 'https://example.com/passport.jpg'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or missing document type');
    });

    it('rejects submission without document attachment', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'UNILAG Student ID Card',
          documentUrl: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('attachment is required');
    });

    it('prevents duplicate active pending submissions', async () => {
      const { studentToken } = await setupUsers();

      // First submission
      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/doc1.png'
        });

      // Duplicate submission attempt
      const resDup = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Course Registration Form (Duly Signed)',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/doc2.png'
        });

      expect(resDup.statusCode).toBe(409);
      expect(resDup.body.message).toContain('already have an active verification request pending');
    });

    it('rejects submission if student is already verified', async () => {
      const { studentToken, studentUser } = await setupUsers();

      await User.findByIdAndUpdate(studentUser._id, { verificationStatus: VERIFICATION_STATUS.VERIFIED });

      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/doc1.png'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already verified');
    });
  });

  describe('GET /api/verification/status', () => {
    it('returns unverified status when no submissions have occurred', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.verificationStatus).toBe(VERIFICATION_STATUS.UNVERIFIED);
      expect(res.body.currentRequest).toBeNull();
    });

    it('returns pending status and current request details after submission', async () => {
      const { studentToken } = await setupUsers();

      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Course Registration Form (Duly Signed)',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/form.pdf'
        });

      const res = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.verificationStatus).toBe(VERIFICATION_STATUS.PENDING);
      expect(res.body.currentRequest).toHaveProperty('documentType', 'Course Registration Form (Duly Signed)');
    });
  });

  describe('GET /api/verification/requests (Admin & Moderation)', () => {
    it('allows admin to list verification requests', async () => {
      const { studentToken, adminToken } = await setupUsers();

      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Docket / Exam Slip',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/docket.pdf'
        });

      const res = await request(app)
        .get('/api/verification/requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requests).toHaveLength(1);
      expect(res.body.requests[0].matricNumber).toBe('190805123');
      expect(res.body.pagination).toHaveProperty('total', 1);
    });

    it('forbids standard student from accessing admin requests list', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .get('/api/verification/requests')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/verification/requests/:id/review', () => {
    it('allows admin to approve a verification request', async () => {
      const { studentToken, studentUser, adminToken } = await setupUsers();

      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/card.png'
        });
      const requestId = subRes.body.verificationRequest._id;

      const res = await request(app)
        .patch(`/api/verification/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'approve',
          adminNotes: 'Confirmed matriculation against faculty roster'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationRequest.status).toBe(VERIFICATION_STATUS.VERIFIED);
      expect(res.body.verificationRequest.reviewedBy).toBeDefined();

      // Check user record is now verified
      const user = await User.findById(studentUser._id);
      expect(user.verificationStatus).toBe(VERIFICATION_STATUS.VERIFIED);
    });

    it('allows admin to reject with clear reason and lets student resubmit', async () => {
      const { studentToken, studentUser, adminToken } = await setupUsers();

      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/card.png'
        });
      const requestId = subRes.body.verificationRequest._id;

      const res = await request(app)
        .patch(`/api/verification/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'reject',
          rejectionReason: 'ID card photo is blurry. Please provide a clear scan or signed course form.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationRequest.status).toBe(VERIFICATION_STATUS.REJECTED);
      expect(res.body.verificationRequest.rejectionReason).toContain('blurry');

      // User status is now rejected
      const user = await User.findById(studentUser._id);
      expect(user.verificationStatus).toBe(VERIFICATION_STATUS.REJECTED);

      // Student can now submit a corrected document
      const resReSubmit = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Course Registration Form (Duly Signed)',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/signed_form.pdf'
        });

      expect(resReSubmit.statusCode).toBe(201);
      expect(resReSubmit.body.verificationRequest.status).toBe(VERIFICATION_STATUS.PENDING);
    });

    it('rejects review without rejectionReason when action is reject', async () => {
      const { studentToken, adminToken } = await setupUsers();

      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/card.png'
        });
      const requestId = subRes.body.verificationRequest._id;

      const res = await request(app)
        .patch(`/api/verification/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'reject'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('rejection reason is required');
    });

    it('forbids reviewing an already approved or rejected request', async () => {
      const { studentToken, adminToken } = await setupUsers();

      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'https://storage.pharmalink.unilag.edu.ng/card.png'
        });
      const requestId = subRes.body.verificationRequest._id;

      // First review
      await request(app)
        .patch(`/api/verification/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'approve' });

      // Second review attempt
      const resRepeat = await request(app)
        .patch(`/api/verification/requests/${requestId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'reject', rejectionReason: 'Changed mind' });

      expect(resRepeat.statusCode).toBe(400);
      expect(resRepeat.body.message).toContain('already been reviewed');
    });
  });

  describe('Community Access Boundary Verification (requireVerified middleware)', () => {
    it('blocks unverified student from verified-only features', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .get('/api/verification/verified-only-gate')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Access restricted to verified UNILAG Pharmacy students');
    });

    it('allows access to verified students once approved', async () => {
      const { studentToken, studentUser } = await setupUsers();

      // Approve student
      await User.findByIdAndUpdate(studentUser._id, { verificationStatus: VERIFICATION_STATUS.VERIFIED });

      const res = await request(app)
        .get('/api/verification/verified-only-gate')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Welcome to verified student lounge!');
    });
  });
});
