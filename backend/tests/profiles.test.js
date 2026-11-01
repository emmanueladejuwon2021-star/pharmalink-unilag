const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const AcademicPeriod = require('../src/models/AcademicPeriod');
const { VERIFICATION_STATUS, computeProfileCompleteness } = require('@pharmalink/shared');

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
  await AcademicPeriod.deleteMany({});
  await User.deleteMany({});
});

async function registerStudent(payload) {
  const res = await request(app).post('/api/auth/register').send(payload);
  expect(res.statusCode).toBe(201);
  return { token: res.body.token, user: res.body.user };
}

async function markVerified(userId) {
  await User.findByIdAndUpdate(userId, {
    verificationStatus: VERIFICATION_STATUS.VERIFIED
  });
}

describe('EPIC-005: User Profiles and Identity API', () => {
  const chioma = {
    fullName: 'Chioma Okeke',
    email: 'cokeke@live.unilag.edu.ng',
    matricNumber: '190805123',
    level: '400L',
    password: 'Password123!'
  };
  const tunde = {
    fullName: 'Tunde Bakare',
    email: 'tbakare@live.unilag.edu.ng',
    matricNumber: '210805111',
    level: '300L',
    password: 'Password123!'
  };

  describe('GET /api/profiles/me', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/profiles/me');
      expect(res.statusCode).toBe(401);
    });

    it('returns the signed-in student own profile with completeness score', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.fullName).toBe('Chioma Okeke');
      expect(res.body.profile.restricted).toBe(false);
      // Masked matric never leaks the full number
      expect(res.body.profile.matricNumberMasked).not.toContain('0805');
      expect(JSON.stringify(res.body)).not.toContain('190805123');
      expect(typeof res.body.profile.completeness).toBe('number');
    });

    it('includes academic period when one exists', async () => {
      const { token, user } = await registerStudent(chioma);
      await request(app)
        .put('/api/academic/my-period')
        .set('Authorization', `Bearer ${token}`)
        .send({ session: '2025/2026', semester: 'First Semester' });

      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.academic.session).toBe('2025/2026');
      expect(res.body.academic.currentLevel).toBe(user.level);
    });
  });

  describe('PATCH /api/profiles/me', () => {
    it('updates bio, interests, graduating year, and visibility', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bio: 'Clinical pharmacy enthusiast and PGDA member.',
          interests: ['Clinical Pharmacy & Therapeutics', 'Pharmacology'],
          graduatingYear: 2028,
          profileVisibility: 'verified-only'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.profile.bio).toBe('Clinical pharmacy enthusiast and PGDA member.');
      expect(res.body.profile.interests).toEqual([
        'Clinical Pharmacy & Therapeutics',
        'Pharmacology'
      ]);
      expect(res.body.profile.graduatingYear).toBe(2028);
      expect(res.body.profile.completeness).toBe(
        computeProfileCompleteness({
          fullName: 'Chioma Okeke',
          matricNumber: '190805123',
          level: '400L',
          verificationStatus: 'unverified',
          bio: 'x',
          interests: ['Pharmacology'],
          graduatingYear: 2028
        })
      );
    });

    it('rejects unknown interest areas', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ interests: ['Football'] });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('de-duplicates repeated interests', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ interests: ['Pharmacology', 'Pharmacology'] });

      expect(res.statusCode).toBe(200);
      expect(res.body.profile.interests).toEqual(['Pharmacology']);
    });

    it('rejects oversized bios (max 300 characters)', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'a'.repeat(301) });

      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid graduation years', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ graduatingYear: 1999 });

      expect(res.statusCode).toBe(400);
    });

    it('refuses to change protected identity fields through this endpoint', async () => {
      const { token } = await registerStudent(chioma);
      const res = await request(app)
        .patch('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'hacker@evil.com' });

      expect(res.statusCode).toBe(400);
      const still = await User.findOne({ email: 'cokeke@live.unilag.edu.ng' });
      expect(still).not.toBeNull();
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .patch('/api/profiles/me')
        .send({ bio: 'hello' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/profiles (community directory)', () => {
    it('blocks unverified students from browsing profiles', async () => {
      const { token } = await registerStudent(tunde);
      const res = await request(app)
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('lists profiles for verified members with level filter', async () => {
      await registerStudent(chioma);
      const t = await registerStudent(tunde);
      await markVerified(t.user._id);

      const res = await request(app)
        .get('/api/profiles?level=400L')
        .set('Authorization', `Bearer ${t.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.profiles[0].fullName).toBe('Chioma Okeke');
    });

    it('validates the level filter', async () => {
      const t = await registerStudent(tunde);
      await markVerified(t.user._id);
      const res = await request(app)
        .get('/api/profiles?level=600L')
        .set('Authorization', `Bearer ${t.token}`);
      expect(res.statusCode).toBe(400);
    });

    it('supports safe name search without regex injection', async () => {
      await registerStudent(chioma);
      const t = await registerStudent(tunde);
      await markVerified(t.user._id);

      const res = await request(app)
        .get('/api/profiles?search=.*')
        .set('Authorization', `Bearer ${t.token}`);

      expect(res.statusCode).toBe(200);
      // Escaped literal ".*" should match nobody
      expect(res.body.count).toBe(0);
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('lets a verified member view another profile', async () => {
      const c = await registerStudent(chioma);
      const t = await registerStudent(tunde);
      await markVerified(t.user._id);

      const res = await request(app)
        .get(`/api/profiles/${c.user._id}`)
        .set('Authorization', `Bearer ${t.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.profile.fullName).toBe('Chioma Okeke');
      expect(res.body.profile.restricted).toBe(false);
    });

    it('blocks unverified visitors from other profiles', async () => {
      const c = await registerStudent(chioma);
      const t = await registerStudent(tunde);

      const res = await request(app)
        .get(`/api/profiles/${c.user._id}`)
        .set('Authorization', `Bearer ${t.token}`);

      expect(res.statusCode).toBe(403);
    });

    it('lets owners always view their own profile even while unverified', async () => {
      const t = await registerStudent(tunde);
      const res = await request(app)
        .get(`/api/profiles/${t.user._id}`)
        .set('Authorization', `Bearer ${t.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.profile.restricted).toBe(false);
    });

    it('returns 404 for missing users and 400 for malformed ids', async () => {
      const t = await registerStudent(tunde);
      await markVerified(t.user._id);

      const missing = await request(app)
        .get(`/api/profiles/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${t.token}`);
      expect(missing.statusCode).toBe(404);

      const bad = await request(app)
        .get('/api/profiles/not-an-id')
        .set('Authorization', `Bearer ${t.token}`);
      expect(bad.statusCode).toBe(400);
    });
  });
});
