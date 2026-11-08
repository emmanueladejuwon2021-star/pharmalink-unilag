require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Material = require('../src/models/Material');

jest.setTimeout(120000);

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
  await Material.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Material.deleteMany({});
});

describe('EPIC-011 & EPIC-012: Materials Vault & Document Storage API', () => {
  async function createStudent(overrides = {}) {
    const matricNum = overrides.matricNumber || '190805' + Math.floor(100 + Math.random() * 900);
    const emailAddr = overrides.email || `student${Math.floor(100 + Math.random() * 900)}@live.unilag.edu.ng`;

    const defaultData = {
      fullName: 'Babatunde Fashola',
      email: emailAddr,
      matricNumber: matricNum,
      level: '300L',
      password: 'StrongPassword123!',
      ...overrides
    };

    const res = await request(app).post('/api/auth/register').send(defaultData);
    const token = res.body.token;
    const userId = res.body.user._id || res.body.user.id;

    if (overrides.verificationStatus !== 'unverified') {
      await User.findByIdAndUpdate(userId, {
        verificationStatus: 'verified',
        role: overrides.role || 'student'
      });
    }

    const updatedUser = await User.findById(userId);
    return { token, user: updatedUser };
  }

  describe('POST /api/materials (Upload Material)', () => {
    it('rejects material upload if student is unverified with 403', async () => {
      const student = await createStudent({ verificationStatus: 'unverified' });

      const res = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'PCH 301 Lecture Slides',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/pch301.pdf',
          fileName: 'pch301.pdf'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verification required/i);
    });

    it('allows verified student to upload a material and awards +10 reputation points', async () => {
      const student = await createStudent({ level: '300L' });
      const initialReputation = student.user.stats.reputationPoints || 10;

      const res = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Medicinal Chemistry SAR Comprehensive Guide',
          description: 'Detailed study guide for adrenergic and cholinergic drugs',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          academicSession: '2024/2025',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/materials/pch301_guide.pdf',
          fileName: 'pch301_sar_guide.pdf',
          fileSizeBytes: 1048576,
          mimeType: 'application/pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.material.title).toBe('Medicinal Chemistry SAR Comprehensive Guide');
      expect(res.body.material.courseCode).toBe('PCH 301');
      expect(res.body.material.department).toBe('PCH');
      expect(res.body.material.level).toBe('300L');
      expect(res.body.material.semester).toBe('First Semester');
      expect(res.body.material.materialType).toBe('Lecture Note');
      expect(res.body.material.academicSession).toBe('2024/2025');
      expect(res.body.material.fileName).toBe('pch301_sar_guide.pdf');
      expect(res.body.material.fileSizeBytes).toBe(1048576);
      expect(res.body.material.isUploader).toBe(true);
      expect(res.body.material.uploader.fullName).toBe('Babatunde Fashola');

      // Verify uploader stats: +1 materialsCount and +10 reputation points
      const updatedUser = await User.findById(student.user._id);
      expect(updatedUser.stats.materialsCount).toBe(1);
      expect(updatedUser.stats.reputationPoints).toBe(initialReputation + 10);
    });

    it('rejects upload with missing or invalid metadata', async () => {
      const student = await createStudent();

      // Missing title
      const res1 = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/file.pdf',
          fileName: 'file.pdf'
        });
      expect(res1.status).toBe(400);

      // Invalid course code
      const res2 = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Valid Title Here',
          courseCode: 'INVALIDCODE',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/file.pdf',
          fileName: 'file.pdf'
        });
      expect(res2.status).toBe(400);

      // Invalid material type
      const res3 = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Valid Title Here',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Not A Real Type',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/file.pdf',
          fileName: 'file.pdf'
        });
      expect(res3.status).toBe(400);

      // Invalid academic session format
      const res4 = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Valid Title Here',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          academicSession: '2024-2025',
          fileUrl: 'https://storage.pharmalink.unilag.edu.ng/file.pdf',
          fileName: 'file.pdf'
        });
      expect(res4.status).toBe(400);
    });
  });

  describe('GET /api/materials (Search & Filters)', () => {
    it('filters materials by department, level, course, type, keyword search, and pagination', async () => {
      const student = await createStudent();

      // Create Material 1: PCH 300L First Semester Lecture Note
      await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'PCH 301 Medicinal Chemistry Fundamentals',
          description: 'Introduction to drug-target interactions and pharmacophores',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          academicSession: '2023/2024',
          fileUrl: 'https://storage.example.com/pch301.pdf',
          fileName: 'pch301.pdf'
        });

      // Create Material 2: PCT 300L Second Semester Past Question
      await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'PCT 302 Pharmaceutics Past Examination Questions',
          description: 'Compilation of 2018-2023 degree exams with model solutions',
          courseCode: 'PCT 302',
          department: 'PCT',
          level: '300L',
          semester: 'Second Semester',
          materialType: 'Past Question',
          academicSession: '2024/2025',
          fileUrl: 'https://storage.example.com/pct302.pdf',
          fileName: 'pct302_pq.pdf'
        });

      // Create Material 3: CPH 400L First Semester Summary Sheet
      await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'CPH 401 Clinical Pharmacokinetics Summary Chart',
          description: 'Quick reference sheet for clearance, volume of distribution, and half-life',
          courseCode: 'CPH 401',
          department: 'CPH',
          level: '400L',
          semester: 'First Semester',
          materialType: 'Summary Sheet',
          academicSession: '2024/2025',
          fileUrl: 'https://storage.example.com/cph401.pdf',
          fileName: 'cph401_summary.pdf'
        });

      // Filter by department
      const resDept = await request(app)
        .get('/api/materials?department=PCH')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resDept.status).toBe(200);
      expect(resDept.body.materials.length).toBe(1);
      expect(resDept.body.materials[0].department).toBe('PCH');

      // Filter by level
      const resLevel = await request(app)
        .get('/api/materials?level=400L')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resLevel.status).toBe(200);
      expect(resLevel.body.materials.length).toBe(1);
      expect(resLevel.body.materials[0].level).toBe('400L');
      expect(resLevel.body.materials[0].courseCode).toBe('CPH 401');

      // Filter by course code
      const resCourse = await request(app)
        .get('/api/materials?courseCode=PCT 302')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resCourse.status).toBe(200);
      expect(resCourse.body.materials.length).toBe(1);
      expect(resCourse.body.materials[0].courseCode).toBe('PCT 302');

      // Filter by material type
      const resType = await request(app)
        .get('/api/materials?materialType=Past Question')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resType.status).toBe(200);
      expect(resType.body.materials.length).toBe(1);
      expect(resType.body.materials[0].materialType).toBe('Past Question');

      // Search keyword in title or description
      const resSearch = await request(app)
        .get('/api/materials?search=pharmacophores')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resSearch.status).toBe(200);
      expect(resSearch.body.materials.length).toBe(1);
      expect(resSearch.body.materials[0].courseCode).toBe('PCH 301');

      // Pagination
      const resPage = await request(app)
        .get('/api/materials?page=1&limit=2')
        .set('Authorization', `Bearer ${student.token}`);
      expect(resPage.status).toBe(200);
      expect(resPage.body.materials.length).toBe(2);
      expect(resPage.body.pagination.total).toBe(3);
      expect(resPage.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/materials/:id', () => {
    it('retrieves single material and increments viewsCount atomically', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'PCG 301 Pharmacognosy Herbarium Guide',
          courseCode: 'PCG 301',
          department: 'PCG',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lab Resource',
          fileUrl: 'https://storage.example.com/pcg301.pdf',
          fileName: 'pcg301_lab.pdf'
        });

      const materialId = createRes.body.material._id;

      const res = await request(app)
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.material._id).toBe(materialId);
      expect(res.body.material.viewsCount).toBe(1);

      // Verify in database that viewsCount is recorded
      const dbRecord = await Material.findById(materialId);
      expect(dbRecord.viewsCount).toBe(1);
    });

    it('returns 404 for nonexistent material', async () => {
      const student = await createStudent();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/materials/${fakeId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST & GET /api/materials/:id/download', () => {
    it('records download, increments downloadsCount, and awards uploader +2 reputation points', async () => {
      const uploader = await createStudent();
      const downloader = await createStudent();

      const uploadRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${uploader.token}`)
        .send({
          title: 'PCL 401 Applied Pharmacology Handbook',
          courseCode: 'PCL 401',
          department: 'PCL',
          level: '400L',
          semester: 'First Semester',
          materialType: 'Textbook / Reference',
          fileUrl: 'https://storage.example.com/pcl401.pdf',
          fileName: 'pcl401_handbook.pdf'
        });

      const materialId = uploadRes.body.material._id;

      // Initial uploader reputation after upload (+10 points)
      const uploaderBefore = await User.findById(uploader.user._id);
      const repBefore = uploaderBefore.stats.reputationPoints;

      // Downloader requests download
      const downloadRes = await request(app)
        .post(`/api/materials/${materialId}/download`)
        .set('Authorization', `Bearer ${downloader.token}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.body.success).toBe(true);
      expect(downloadRes.body.downloadUrl).toBe('https://storage.example.com/pcl401.pdf');
      expect(downloadRes.body.fileName).toBe('pcl401_handbook.pdf');
      expect(downloadRes.body.downloadsCount).toBe(1);

      // Verify atomic database updates
      const materialDb = await Material.findById(materialId);
      expect(materialDb.downloadsCount).toBe(1);

      const uploaderAfter = await User.findById(uploader.user._id);
      expect(uploaderAfter.stats.reputationPoints).toBe(repBefore + 2);
    });
  });

  describe('PATCH /api/materials/:id (Update Material)', () => {
    it('allows uploader to update material title, description, and materialType', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Original Title',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.example.com/file.pdf',
          fileName: 'file.pdf'
        });

      const materialId = createRes.body.material._id;

      const updateRes = await request(app)
        .patch(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Updated Comprehensive Title',
          description: 'Added detailed chapter summaries',
          materialType: 'Summary Sheet'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.material.title).toBe('Updated Comprehensive Title');
      expect(updateRes.body.material.description).toBe('Added detailed chapter summaries');
      expect(updateRes.body.material.materialType).toBe('Summary Sheet');
    });

    it('rejects update attempt by another student with 403', async () => {
      const uploader = await createStudent();
      const anotherStudent = await createStudent();

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${uploader.token}`)
        .send({
          title: 'Author Note',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.example.com/file.pdf',
          fileName: 'file.pdf'
        });

      const materialId = createRes.body.material._id;

      const res = await request(app)
        .patch(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${anotherStudent.token}`)
        .send({ title: 'Tampered Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows administrator to edit any material', async () => {
      const uploader = await createStudent();
      const admin = await createStudent({ role: 'admin' });

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${uploader.token}`)
        .send({
          title: 'Student Upload',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.example.com/file.pdf',
          fileName: 'file.pdf'
        });

      const materialId = createRes.body.material._id;

      const res = await request(app)
        .patch(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ title: 'Moderated Official Title' });

      expect(res.status).toBe(200);
      expect(res.body.material.title).toBe('Moderated Official Title');
    });
  });

  describe('DELETE /api/materials/:id (Soft Delete)', () => {
    it('allows uploader to soft delete material and decrements uploader materialsCount', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Material to be deleted',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.example.com/file.pdf',
          fileName: 'file.pdf'
        });

      const materialId = createRes.body.material._id;

      const userBefore = await User.findById(student.user._id);
      expect(userBefore.stats.materialsCount).toBe(1);

      const delRes = await request(app)
        .delete(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify soft delete in DB
      const dbRecord = await Material.findById(materialId);
      expect(dbRecord.isDeleted).toBe(true);

      // Verify decremented materialsCount
      const userAfter = await User.findById(student.user._id);
      expect(userAfter.stats.materialsCount).toBe(0);

      // Verify material is no longer returned in list
      const listRes = await request(app)
        .get('/api/materials')
        .set('Authorization', `Bearer ${student.token}`);
      expect(listRes.body.materials.length).toBe(0);

      // Verify 404 when querying single
      const getRes = await request(app)
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${student.token}`);
      expect(getRes.status).toBe(404);
    });

    it('rejects delete attempt by unauthorized student with 403', async () => {
      const uploader = await createStudent();
      const attacker = await createStudent();

      const createRes = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${uploader.token}`)
        .send({
          title: 'Protected Material',
          courseCode: 'PCH 301',
          department: 'PCH',
          level: '300L',
          semester: 'First Semester',
          materialType: 'Lecture Note',
          fileUrl: 'https://storage.example.com/file.pdf',
          fileName: 'file.pdf'
        });

      const materialId = createRes.body.material._id;

      const delRes = await request(app)
        .delete(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${attacker.token}`);

      expect(delRes.status).toBe(403);
    });
  });
});
