const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const AcademicCourse = require('../src/models/AcademicCourse');
const AcademicPeriod = require('../src/models/AcademicPeriod');
const { USER_ROLES, SEMESTERS, resolveCurrentAcademicPeriod } = require('@pharmalink/shared');

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
  await AcademicCourse.deleteMany({});
  await User.deleteMany({});
});

async function registerAndMakeRole(payload, role) {
  const regRes = await request(app).post('/api/auth/register').send(payload);
  expect(regRes.statusCode).toBe(201);
  const user = await User.findById(regRes.body.user._id);
  if (role) {
    user.role = role;
    await user.save({ validateBeforeSave: false });
  }
  return { token: regRes.body.token, user };
}

describe('EPIC-004: Academic Structure and Session Management API', () => {
  let studentToken;
  let studentUser;
  let adminToken;

  beforeEach(async () => {
    const student = await registerAndMakeRole({
      fullName: 'Tunde Bakare',
      email: 'tbakare@live.unilag.edu.ng',
      matricNumber: '210805111',
      level: '300L',
      password: 'Password123!'
    });
    studentToken = student.token;
    studentUser = student.user;

    const admin = await registerAndMakeRole(
      {
        fullName: 'Admin Pharmacist',
        email: 'admin@unilag.edu.ng',
        matricNumber: '150805001',
        level: '500L',
        password: 'AdminPassword123!'
      },
      USER_ROLES.ADMIN
    );
    adminToken = admin.token;
  });

  describe('GET /api/academic/current-period', () => {
    it('returns the live UNILAG academic session and semester', async () => {
      const res = await request(app).get('/api/academic/current-period');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const expected = resolveCurrentAcademicPeriod(new Date());
      expect(res.body.period.session).toBe(expected.session);
      expect(res.body.period.semester).toBe(expected.semester);
      expect(res.body.period.sessions).toContain(expected.session);
    });
  });

  describe('Course catalogue', () => {
    it('rejects course creation by non-staff users', async () => {
      const res = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'PHR301', title: 'Pharmacology III', level: '300L' });
      expect(res.statusCode).toBe(403);
    });

    it('creates a course, prevents duplicates, and rejects invalid levels', async () => {
      const res = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'phr301',
          title: 'Clinical Pharmacy I',
          level: '300L',
          unit: 3,
          semester: SEMESTERS[0]
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.course.code).toBe('PHR301'); // normalised to uppercase

      // Duplicate rejected
      const dupRes = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'PHR301', title: 'Another Course', level: '300L' });
      expect(dupRes.statusCode).toBe(409);

      // Invalid level rejected
      const badRes = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'PHR999', title: 'Bogus Unit', level: '600L' });
      expect(badRes.statusCode).toBe(400);
    });

    it('requires authentication to list courses and supports level filtering', async () => {
      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'PYC201', title: 'Physiology for Pharmacists', level: '200L' });
      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'PHA302', title: 'Pharmaceutical Chemistry III', level: '300L' });

      const anonRes = await request(app).get('/api/academic/courses');
      expect(anonRes.statusCode).toBe(401);

      const allRes = await request(app)
        .get('/api/academic/courses')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(allRes.statusCode).toBe(200);
      expect(allRes.body.count).toBe(2);

      const filtered = await request(app)
        .get('/api/academic/courses?level=300L')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(filtered.body.courses).toHaveLength(1);
      expect(filtered.body.courses[0].code).toBe('PHA302');

      const badFilter = await request(app)
        .get('/api/academic/courses?level=100L')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(badFilter.statusCode).toBe(400);
    });

    it('allows admins to update and deactivate a course', async () => {
      const created = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'PHM401', title: 'Pharmacy Practice', level: '400L' });

      const patchRes = await request(app)
        .patch(`/api/academic/courses/${created.body.course._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Hospital & Community Pharmacy', isActive: false });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.course.title).toBe('Hospital & Community Pharmacy');
      expect(patchRes.body.course.isActive).toBe(false);

      // Deactivated courses disappear from the listing
      const list = await request(app)
        .get('/api/academic/courses')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(list.body.count).toBe(0);
    });
  });

  describe('Student academic periods', () => {
    it('auto-initialises the student period from the live calendar', async () => {
      const res = await request(app)
        .get('/api/academic/my-period')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.period.currentLevel).toBe('300L');

      const expected = resolveCurrentAcademicPeriod(new Date());
      expect(res.body.period.session).toBe(expected.session);
      expect(res.body.period.semester).toBe(expected.semester);

      const stored = await AcademicPeriod.findOne({ user: studentUser._id });
      expect(stored).not.toBeNull();
    });

    it('lets students update their session and semester with validation', async () => {
      const good = await request(app)
        .put('/api/academic/my-period')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ session: '2024/2025', semester: SEMESTERS[1] });
      expect(good.statusCode).toBe(200);
      expect(good.body.period.session).toBe('2024/2025');

      const badSession = await request(app)
        .put('/api/academic/my-period')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ session: '2024/2027', semester: SEMESTERS[0] });
      expect(badSession.statusCode).toBe(400);

      const badSemester = await request(app)
        .put('/api/academic/my-period')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ session: '2024/2025', semester: 'Summer Term' });
      expect(badSemester.statusCode).toBe(400);
    });
  });

  describe('Level progression (staff promotions)', () => {
    it('promotes a student one level and records progression history', async () => {
      const res = await request(app)
        .post(`/api/academic/admin/promote/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'End of 300L academic year' });

      expect(res.statusCode).toBe(200);
      expect(res.body.student.level).toBe('400L');
      expect(res.body.period.currentLevel).toBe('400L');
      expect(res.body.period.progressionHistory).toHaveLength(1);
      expect(res.body.period.progressionHistory[0]).toMatchObject({
        fromLevel: '300L',
        toLevel: '400L'
      });

      // The authoritative User record must stay in sync
      const refreshed = await User.findById(studentUser._id);
      expect(refreshed.level).toBe('400L');
    });

    it('refuses to promote past 500L and blocks non-staff users', async () => {
      await User.updateOne({ _id: studentUser._id }, { level: '500L' });

      const finalRes = await request(app)
        .post(`/api/academic/admin/promote/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(finalRes.statusCode).toBe(400);
      expect(finalRes.body.message).toMatch(/final eligible level/);

      const forbidden = await request(app)
        .post(`/api/academic/admin/promote/${studentUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});
      expect(forbidden.statusCode).toBe(403);
    });

    it('returns 404 for unknown student ids', async () => {
      const res = await request(app)
        .post(`/api/academic/admin/promote/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.statusCode).toBe(404);
    });
  });
});
