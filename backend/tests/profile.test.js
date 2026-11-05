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

describe('EPIC-005: User Profiles and Identity API', () => {
  async function createStudent(overrides = {}) {
    const matric = overrides.matricNumber || '190805' + Math.floor(100 + Math.random() * 900);
    const email = overrides.email || `student${Math.floor(100 + Math.random() * 900)}@live.unilag.edu.ng`;

    const defaultData = {
      fullName: 'Amina Danjuma',
      email,
      matricNumber: matric,
      level: '400L',
      password: 'AminaPassword123!',
      ...overrides
    };

    const res = await request(app).post('/api/auth/register').send(defaultData);
    return { token: res.body.token, user: res.body.user };
  }

  describe('GET /api/profile/me', () => {
    it('returns the active student profile details', async () => {
      const { token, user } = await createStudent();

      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.matricNumber).toBe(user.matricNumber);
      expect(res.body.user.stats).toBeDefined();
      expect(res.body.user.stats.reputationPoints).toBe(10);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/profile/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/profile/me', () => {
    it('successfully updates student bio, department, and academic interests', async () => {
      const { token } = await createStudent();

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bio: 'Passionate pharmacy student interested in nanomedicine research.',
          department: 'PCT',
          interests: ['Formulation Science', 'Drug Delivery', 'Cosmeceuticals'],
          phone: '+2348012345678',
          socialLinks: {
            linkedin: 'https://linkedin.com/in/aminadanjuma',
            twitter: 'https://twitter.com/aminad'
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.bio).toContain('nanomedicine research');
      expect(res.body.user.department).toBe('PCT');
      expect(res.body.user.interests).toHaveLength(3);
      expect(res.body.user.interests).toContain('Formulation Science');
      expect(res.body.user.socialLinks.linkedin).toBe('https://linkedin.com/in/aminadanjuma');
    });

    it('rejects bio longer than 300 characters', async () => {
      const { token } = await createStudent();
      const longBio = 'A'.repeat(301);

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: longBio });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/300 characters/i);
    });

    it('rejects invalid department code', async () => {
      const { token } = await createStudent();

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ department: 'XYZ' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid department code/i);
    });
  });

  describe('GET /api/profile/:id', () => {
    it('returns the public student profile for other students', async () => {
      const student1 = await createStudent({
        fullName: 'Chinedu Eze',
        email: 'ceze@live.unilag.edu.ng',
        matricNumber: '190805111',
        level: '500L'
      });

      const student2 = await createStudent({
        fullName: 'Zainab Ahmed',
        email: 'zahmed@live.unilag.edu.ng',
        matricNumber: '190805222',
        level: '300L'
      });

      // Update student1 profile with department and bio
      await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${student1.token}`)
        .send({
          department: 'CPH',
          bio: 'Final year clinical pharmacy scholar.'
        });

      // student2 views student1's profile
      const res = await request(app)
        .get(`/api/profile/${student1.user._id}`)
        .set('Authorization', `Bearer ${student2.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.fullName).toBe('Chinedu Eze');
      expect(res.body.profile.department).toBe('CPH');
      expect(res.body.profile.level).toBe('500L');
      expect(res.body.profile.bio).toContain('Final year clinical pharmacy scholar');
      // Private fields like password must not be present
      expect(res.body.profile.password).toBeUndefined();
    });

    it('returns 404 for non-existent student profile', async () => {
      const { token } = await createStudent();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/profile/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/profile/directory/students', () => {
    it('lists students and filters by level and department', async () => {
      const s1 = await createStudent({
        fullName: 'Bolanle Alade',
        email: 'balade@live.unilag.edu.ng',
        matricNumber: '190805333',
        level: '200L'
      });

      const s2 = await createStudent({
        fullName: 'Emeka Nwosu',
        email: 'enwosu@live.unilag.edu.ng',
        matricNumber: '190805444',
        level: '300L'
      });

      await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${s2.token}`)
        .send({ department: 'PCH' });

      // Query all directory
      const resAll = await request(app)
        .get('/api/profile/directory/students')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resAll.statusCode).toBe(200);
      expect(resAll.body.success).toBe(true);
      expect(resAll.body.students.length).toBeGreaterThanOrEqual(2);

      // Filter by level 300L
      const resLevel = await request(app)
        .get('/api/profile/directory/students?level=300L')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resLevel.statusCode).toBe(200);
      expect(resLevel.body.students.some((s) => s.fullName === 'Emeka Nwosu')).toBe(true);
      expect(resLevel.body.students.some((s) => s.fullName === 'Bolanle Alade')).toBe(false);

      // Filter by department PCH
      const resDept = await request(app)
        .get('/api/profile/directory/students?department=PCH')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resDept.statusCode).toBe(200);
      expect(resDept.body.students.some((s) => s.fullName === 'Emeka Nwosu')).toBe(true);

      // Search by name keyword
      const resSearch = await request(app)
        .get('/api/profile/directory/students?search=Bolanle')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resSearch.statusCode).toBe(200);
      expect(resSearch.body.students.some((s) => s.fullName === 'Bolanle Alade')).toBe(true);
    });
  });
});
