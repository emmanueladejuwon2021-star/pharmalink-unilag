require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

jest.setTimeout(60000);

let mongoServer;
const testDbUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (testDbUri) {
    await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 30000 });
  } else {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
}, 120000);

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
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
    it('successfully registers an eligible UNILAG Pharmacy student (300L)', async () => {
      const res = await request(app).post('/api/auth/register').send(validStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validStudent.email);
      expect(res.body.user.matricNumber).toBe(validStudent.matricNumber);
      expect(res.body.user.verificationStatus).toBe('unverified');
      expect(res.body.user.password).toBeUndefined(); // Password must never be leaked
    });

    it('rejects registration with invalid email domain', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, email: 'student@gmail.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/(UNILAG students?|valid UNILAG email)/i);
    });

    it('rejects registration with invalid academic level (100L or 600L)', async () => {
      const res100 = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, level: '100L' });

      expect(res100.statusCode).toBe(400);
      expect(res100.body.success).toBe(false);

      const res600 = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, level: '600L' });

      expect(res600.statusCode).toBe(400);
      expect(res600.body.success).toBe(false);
    });

    it('rejects registration with invalid matric number format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, matricNumber: '190805' }); // Only 6 digits

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/9-?digits?/i);
    });

    it('rejects duplicate email and duplicate matric numbers', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validStudent);

      // Attempt duplicate email with different matric
      const resDupEmail = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, matricNumber: '190805999' });

      expect(resDupEmail.statusCode).toBe(409);
      expect(resDupEmail.body.success).toBe(false);

      // Attempt duplicate matric with different email
      const resDupMatric = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, email: 'another@live.unilag.edu.ng' });

      expect(resDupMatric.statusCode).toBe(409);
      expect(resDupMatric.body.success).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validStudent, password: 'short' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 8 characters/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validStudent);
    });

    it('allows logging in with registered UNILAG email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: validStudent.email,
        password: validStudent.password
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validStudent.email);
    });

    it('allows logging in with registered matriculation number', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: validStudent.matricNumber,
        password: validStudent.password
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.matricNumber).toBe(validStudent.matricNumber);
    });

    it('rejects invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: validStudent.email,
        password: 'WrongPassword999!'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/(Invalid email\/matric number or password|Invalid login credentials)/i);
    });

    it('rejects non-existent student credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: 'nonexistent@live.unilag.edu.ng',
        password: 'AnyPassword123!'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Routes & Session Verification (GET /api/auth/me)', () => {
    let authToken;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(validStudent);
      authToken = res.body.token;
    });

    it('returns student profile for valid JWT Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(validStudent.email);
      expect(res.body.user.matricNumber).toBe(validStudent.matricNumber);
    });

    it('rejects requests without token or with malformed token', async () => {
      const resNoToken = await request(app).get('/api/auth/me');
      expect(resNoToken.statusCode).toBe(401);

      const resBadToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-garbage-token');
      expect(resBadToken.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('successfully changes password when current password matches', async () => {
      const regRes = await request(app).post('/api/auth/register').send(validStudent);
      const token = regRes.body.token;

      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: validStudent.password,
          newPassword: 'BrandNewPassword456!'
        });

      expect(changeRes.statusCode).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify login with new password succeeds
      const newLoginRes = await request(app).post('/api/auth/login').send({
        identifier: validStudent.email,
        password: 'BrandNewPassword456!'
      });
      expect(newLoginRes.statusCode).toBe(200);

      // Verify old password no longer works
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        identifier: validStudent.email,
        password: validStudent.password
      });
      expect(oldLoginRes.statusCode).toBe(401);
    });
  });
});
