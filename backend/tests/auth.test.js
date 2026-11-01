require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

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
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('EPIC-002: Authentication & Account Security API', () => {
  const validStudent = {
    fullName: 'Adewale Ojo',
    email: 'aojo@live.unilag.edu.ng',
    matricNumber: '190805001',
    level: '300L',
    password: 'SecurePassword123!'
  };

  describe('POST /api/auth/register', () => {
    it('successfully registers a valid UNILAG Pharmacy student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        fullName: 'Adewale Ojo',
        email: 'aojo@live.unilag.edu.ng',
        matricNumber: '190805001',
        level: '300L',
        verificationStatus: 'unverified'
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects registration with non-UNILAG email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          email: 'student@gmail.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('restricted to UNILAG students');
    });

    it('rejects registration with invalid academic level (100L or 600L)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          level: '100L'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('200L, 300L, 400L, or 500L');
    });

    it('rejects registration with invalid matric number format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          matricNumber: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('9-digit UNILAG matric number');
    });

    it('rejects duplicate email and duplicate matric numbers', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validStudent);

      // Duplicate email
      const resDupEmail = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          matricNumber: '190805002'
        });
      expect(resDupEmail.statusCode).toBe(409);
      expect(resDupEmail.body.message).toContain('email address already exists');

      // Duplicate matric
      const resDupMatric = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          email: 'other@live.unilag.edu.ng'
        });
      expect(resDupMatric.statusCode).toBe(409);
      expect(resDupMatric.body.message).toContain('matriculation number already exists');
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validStudent,
          password: 'short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 8 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validStudent);
    });

    it('allows logging in with registered UNILAG email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'aojo@live.unilag.edu.ng',
          password: 'SecurePassword123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('aojo@live.unilag.edu.ng');
    });

    it('allows logging in with registered matric number', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '190805001',
          password: 'SecurePassword123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.matricNumber).toBe('190805001');
    });

    it('rejects incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'aojo@live.unilag.edu.ng',
          password: 'WrongPassword!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid login credentials');
    });
  });

  describe('Protected Routes & Session Verification (GET /api/auth/me)', () => {
    it('returns user session when valid JWT Bearer token is provided', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validStudent);
      const token = regRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(validStudent.email);
    });

    it('rejects requests without token or with malformed token', async () => {
      const resNoToken = await request(app).get('/api/auth/me');
      expect(resNoToken.statusCode).toBe(401);

      const resBadToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(resBadToken.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('successfully changes password when current password matches', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validStudent);
      const token = regRes.body.token;

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SecurePassword123!',
          newPassword: 'BrandNewSecurePassword456!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password succeeds
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: validStudent.email,
          password: 'BrandNewSecurePassword456!'
        });
      expect(loginRes.statusCode).toBe(200);
    });
  });
});
