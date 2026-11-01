require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

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
    const defaultData = {
      fullName: 'Amina Danjuma',
      email: 'adanjuma@live.unilag.edu.ng',
      matricNumber: '190805777',
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
      expect(res.body.user).toMatchObject({
        _id: user._id,
        fullName: 'Amina Danjuma',
        email: 'adanjuma@live.unilag.edu.ng',
        matricNumber: '190805777',
        level: '400L'
      });
      expect(res.body.user).toHaveProperty('stats');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rejects unauthenticated requests without token', async () => {
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
          bio: 'Passionate about pharmaceutical formulations and nanomedicine research at UNILAG.',
          department: 'PCT',
          interests: ['Formulation Science', 'Drug Delivery', 'Biopharmaceutics'],
          socialLinks: {
            linkedin: 'https://linkedin.com/in/aminadanjuma',
            twitter: '@amina_pharm'
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.bio).toContain('nanomedicine research');
      expect(res.body.user.department).toBe('PCT');
      expect(res.body.user.interests).toEqual(expect.arrayContaining(['Formulation Science', 'Drug Delivery']));
      expect(res.body.user.socialLinks.linkedin).toBe('https://linkedin.com/in/aminadanjuma');
    });

    it('rejects bio exceeding 300 characters', async () => {
      const { token } = await createStudent();

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bio: 'A'.repeat(301)
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('300 characters');
    });

    it('rejects invalid department code', async () => {
      const { token } = await createStudent();

      const res = await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          department: 'ENGINEERING'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid department code');
    });
  });

  describe('GET /api/profile/:id', () => {
    it('returns the public profile of another student', async () => {
      const student1 = await createStudent({
        fullName: 'First Student',
        email: 'first@live.unilag.edu.ng',
        matricNumber: '190805111'
      });

      const student2 = await createStudent({
        fullName: 'Second Student',
        email: 'second@live.unilag.edu.ng',
        matricNumber: '190805222',
        level: '300L'
      });

      const res = await request(app)
        .get(`/api/profile/${student2.user._id}`)
        .set('Authorization', `Bearer ${student1.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile).toMatchObject({
        _id: student2.user._id,
        fullName: 'Second Student',
        level: '300L'
      });
      // Ensure private email / password are not leaked in public profile
      expect(res.body.profile).not.toHaveProperty('email');
      expect(res.body.profile).not.toHaveProperty('password');
    });

    it('returns 404 if profile does not exist', async () => {
      const { token } = await createStudent();
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/profile/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/profile/directory/students', () => {
    it('lists students and filters by level and department', async () => {
      const s1 = await createStudent({
        fullName: 'Bolanle Alade',
        email: 'balade@live.unilag.edu.ng',
        matricNumber: '190805333',
        level: '300L'
      });

      // Update s1 department to CPH
      await request(app)
        .patch('/api/profile/me')
        .set('Authorization', `Bearer ${s1.token}`)
        .send({ department: 'CPH' });

      const s2 = await createStudent({
        fullName: 'Chukwudi Eze',
        email: 'ceze@live.unilag.edu.ng',
        matricNumber: '190805444',
        level: '500L'
      });

      // List all students
      const resAll = await request(app)
        .get('/api/profile/directory/students')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resAll.statusCode).toBe(200);
      expect(resAll.body.students.length).toBeGreaterThanOrEqual(2);

      // Filter by level=300L
      const res300L = await request(app)
        .get('/api/profile/directory/students?level=300L')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(res300L.statusCode).toBe(200);
      expect(res300L.body.students).toHaveLength(1);
      expect(res300L.body.students[0].fullName).toBe('Bolanle Alade');

      // Search by keyword
      const resSearch = await request(app)
        .get('/api/profile/directory/students?search=Chukwudi')
        .set('Authorization', `Bearer ${s1.token}`);

      expect(resSearch.statusCode).toBe(200);
      expect(resSearch.body.students).toHaveLength(1);
      expect(resSearch.body.students[0].fullName).toBe('Chukwudi Eze');
    });
  });
});
