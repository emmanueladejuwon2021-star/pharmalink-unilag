const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const VerificationRequest = require('../src/models/VerificationRequest');
const { USER_ROLES } = require('@pharmalink/shared');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await VerificationRequest.deleteMany({});
  await User.deleteMany({});
});

describe('EPIC-003: Student Verification System API', () => {
  let studentToken;
  let studentUser;
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    // Register normal student
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Folashade Alabi',
        email: 'falabi@live.unilag.edu.ng',
        matricNumber: '200805099',
        level: '300L',
        password: 'Password123!'
      });
    studentToken = regRes.body.token;
    studentUser = regRes.body.user;

    // Register admin user
    const adminRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Admin Pharmacist',
        email: 'admin@unilag.edu.ng',
        matricNumber: '150805001',
        level: '500L',
        password: 'AdminPassword123!'
      });
    adminToken = adminRegRes.body.token;
    adminUser = await User.findById(adminRegRes.body.user._id);
    adminUser.role = USER_ROLES.ADMIN;
    await adminUser.save({ validateBeforeSave: false });
  });

  describe('POST /api/verification/submit', () => {
    it('submits verification proof and changes status to pending', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'data:image/png;base64,sample-image-data',
          studentNote: '300L Faculty of Pharmacy Student ID'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.request.status).toBe('pending');
      expect(res.body.request.documentType).toBe('Faculty ID Card');

      // Check student user model updated
      const updatedUser = await User.findById(studentUser._id);
      expect(updatedUser.verificationStatus).toBe('pending');
    });

    it('rejects duplicate pending submission', async () => {
      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'data:image/png;base64,sample-image-data'
        });

      const secondRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'UNILAG Student ID Card',
          documentUrl: 'data:image/png;base64,second-image'
        });

      expect(secondRes.statusCode).toBe(409);
      expect(secondRes.body.message).toContain('already have a verification request under review');
    });

    it('rejects invalid document type', async () => {
      const res = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Driver License',
          documentUrl: 'data:image/png;base64,sample'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Please select an accepted document type');
    });
  });

  describe('GET /api/verification/status', () => {
    it('returns student current verification state', async () => {
      await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Faculty ID Card',
          documentUrl: 'data:image/png;base64,data'
        });

      const res = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.verificationStatus).toBe('pending');
      expect(res.body.request).not.toBeNull();
      expect(res.body.request.documentType).toBe('Faculty ID Card');
    });
  });

  describe('Admin Review Flow (GET /requests & POST /review/:id)', () => {
    let requestId;

    beforeEach(async () => {
      const subRes = await request(app)
        .post('/api/verification/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          documentType: 'Course Registration Form (Duly Signed)',
          documentUrl: 'data:image/png;base64,form-doc'
        });
      requestId = subRes.body.request._id;
    });

    it('denies regular students from viewing admin queue', async () => {
      const res = await request(app)
        .get('/api/verification/admin/requests')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('allows admin to list pending requests', async () => {
      const res = await request(app)
        .get('/api/verification/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.requests[0]._id.toString()).toBe(requestId.toString());
    });

    it('allows admin to approve student verification', async () => {
      const res = await request(app)
        .post(`/api/verification/admin/review/${requestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approve',
          reviewerNote: 'Course form verified against departmental record.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.student.verificationStatus).toBe('verified');
      expect(res.body.request.status).toBe('verified');

      const userAfter = await User.findById(studentUser._id);
      expect(userAfter.verificationStatus).toBe('verified');
    });

    it('allows admin to reject invalid student verification', async () => {
      const res = await request(app)
        .post(`/api/verification/admin/review/${requestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'reject',
          reviewerNote: 'Document illegible. Please re-upload a clear photo.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.student.verificationStatus).toBe('rejected');

      const userAfter = await User.findById(studentUser._id);
      expect(userAfter.verificationStatus).toBe('rejected');
    });
  });
});
