require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const AcademicSession = require('../src/models/AcademicSession');
const { USER_ROLES } = require('@pharmalink/shared');

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
  await Course.deleteMany({});
  await AcademicSession.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Course.deleteMany({});
  await AcademicSession.deleteMany({});
  await User.deleteMany({});
});

describe('EPIC-004: Academic Structure & Session Management API', () => {
  async function setupUsers() {
    const studentRes = await request(app).post('/api/auth/register').send({
      fullName: 'Oluwaseun Balogun',
      email: 'obalogun@live.unilag.edu.ng',
      matricNumber: '190805321',
      level: '300L',
      password: 'StudentSecurePassword1!'
    });

    const adminRes = await request(app).post('/api/auth/register').send({
      fullName: 'Academic Dean Admin',
      email: 'dean@live.unilag.edu.ng',
      matricNumber: '170805001',
      level: '500L',
      password: 'DeanAdminSecurePassword1!'
    });

    await User.findByIdAndUpdate(adminRes.body.user._id, { role: USER_ROLES.ADMIN });

    return {
      studentToken: studentRes.body.token,
      adminToken: adminRes.body.token
    };
  }

  describe('GET /api/academic/departments', () => {
    it('returns all 5 official UNILAG Faculty of Pharmacy departments', async () => {
      const res = await request(app).get('/api/academic/departments');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.departments).toHaveLength(5);

      const deptCodes = res.body.departments.map((d) => d.code);
      expect(deptCodes).toEqual(expect.arrayContaining(['CPH', 'PCH', 'PCT', 'PCG', 'PCL']));
    });
  });

  describe('Academic Sessions Management', () => {
    it('allows admin to create an academic session and activate it', async () => {
      const { adminToken } = await setupUsers();

      const res = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '2024/2025',
          currentSemester: 'First Semester',
          isCurrent: true
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.session).toMatchObject({
        name: '2024/2025',
        currentSemester: 'First Semester',
        isCurrent: true
      });
    });

    it('rejects invalid academic session format (must be YYYY/YYYY)', async () => {
      const { adminToken } = await setupUsers();

      const res = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '2024-2025',
          currentSemester: 'First Semester'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('YYYY/YYYY');
    });

    it('ensures only one academic session is marked current at any time', async () => {
      const { adminToken } = await setupUsers();

      // Create session 1
      const res1 = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '2024/2025', isCurrent: true });
      expect(res1.statusCode).toBe(201);

      // Create session 2 with isCurrent = true
      const res2 = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '2025/2026', isCurrent: true });
      expect(res2.statusCode).toBe(201);

      // Verify session 1 is no longer current
      const oldSession = await AcademicSession.findOne({ name: '2024/2025' });
      const newSession = await AcademicSession.findOne({ name: '2025/2026' });
      expect(oldSession.isCurrent).toBe(false);
      expect(newSession.isCurrent).toBe(true);
    });

    it('forbids standard student from creating an academic session', async () => {
      const { studentToken } = await setupUsers();

      const res = await request(app)
        .post('/api/academic/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: '2024/2025' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Course Catalog Management', () => {
    it('allows admin to create a valid pharmacy course', async () => {
      const { adminToken } = await setupUsers();

      const res = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PCH 301',
          title: 'Medicinal Chemistry I',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          units: 3,
          description: 'Introduction to physicochemical properties and drug design principles.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.course).toMatchObject({
        code: 'PCH 301',
        title: 'Medicinal Chemistry I',
        department: 'PCH',
        level: '300L',
        units: 3
      });
    });

    it('rejects duplicate course code', async () => {
      const { adminToken } = await setupUsers();

      const courseData = {
        code: 'PCT 401',
        title: 'Industrial Pharmacy Practice',
        department: 'PCT',
        level: '400L',
        semester: 'First Semester',
        units: 4
      };

      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData);

      const dupRes = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData);

      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.message).toContain('already exists');
    });

    it('filters courses by level, department, and semester', async () => {
      const { studentToken, adminToken } = await setupUsers();

      // Seed 2 courses
      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PCH 301',
          title: 'Medicinal Chemistry I',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          units: 3
        });

      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CPH 401',
          title: 'Clinical Pharmacokinetics',
          department: 'CPH',
          level: '400L',
          semester: 'Second Semester',
          units: 3
        });

      // Filter by level=300L
      const res300L = await request(app)
        .get('/api/academic/courses?level=300L')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res300L.statusCode).toBe(200);
      expect(res300L.body.courses).toHaveLength(1);
      expect(res300L.body.courses[0].code).toBe('PCH 301');

      // Filter by department=CPH
      const resCPH = await request(app)
        .get('/api/academic/courses?department=CPH')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resCPH.statusCode).toBe(200);
      expect(resCPH.body.courses).toHaveLength(1);
      expect(resCPH.body.courses[0].code).toBe('CPH 401');
    });

    it('allows searching courses by title or code keyword', async () => {
      const { studentToken, adminToken } = await setupUsers();

      await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PCG 201',
          title: 'Introduction to Pharmacognosy',
          department: 'PCG',
          level: '200L',
          semester: 'First Semester',
          units: 2
        });

      const resSearch = await request(app)
        .get('/api/academic/courses?search=Pharmacognosy')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resSearch.statusCode).toBe(200);
      expect(resSearch.body.courses).toHaveLength(1);
      expect(resSearch.body.courses[0].code).toBe('PCG 201');
    });

    it('allows admin to update course details', async () => {
      const { adminToken } = await setupUsers();

      const createRes = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PCL 501',
          title: 'Advanced Toxicology',
          department: 'PCL',
          level: '500L',
          semester: 'First Semester',
          units: 2
        });

      const courseId = createRes.body.course._id;

      const updateRes = await request(app)
        .patch(`/api/academic/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Advanced Toxicology & Forensic Pharmacy',
          units: 3
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.course.title).toBe('Advanced Toxicology & Forensic Pharmacy');
      expect(updateRes.body.course.units).toBe(3);
    });

    it('allows admin to delete a course', async () => {
      const { adminToken } = await setupUsers();

      const createRes = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'PCL 202',
          title: 'General Pharmacology',
          department: 'PCL',
          level: '200L',
          semester: 'Second Semester',
          units: 3
        });

      const courseId = createRes.body.course._id;

      const deleteRes = await request(app)
        .delete(`/api/academic/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(200);

      const findCourse = await Course.findById(courseId);
      expect(findCourse).toBeNull();
    });
  });
});
