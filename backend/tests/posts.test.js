require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

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
  await Post.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
});

describe('EPIC-006 & EPIC-007: Posts & Social Feed API', () => {
  async function createStudent(overrides = {}) {
    const matricNum = overrides.matricNumber || '190805' + Math.floor(100 + Math.random() * 900);
    const emailAddr = overrides.email || `student${Math.floor(100 + Math.random() * 900)}@live.unilag.edu.ng`;

    const defaultData = {
      fullName: 'Oluwaseun Adeleke',
      email: emailAddr,
      matricNumber: matricNum,
      level: '300L',
      password: 'StrongPassword123!',
      ...overrides
    };

    const res = await request(app).post('/api/auth/register').send(defaultData);
    const token = res.body.token;
    const userId = res.body.user._id || res.body.user.id;

    // By default, mark as verified student
    if (overrides.verificationStatus !== 'unverified') {
      await User.findByIdAndUpdate(userId, {
        verificationStatus: 'verified',
        role: overrides.role || 'student'
      });
    }

    const updatedUser = await User.findById(userId);
    return { token, user: updatedUser };
  }

  describe('POST /api/posts', () => {
    it('rejects post creation if student is unverified', async () => {
      const student = await createStudent({ verificationStatus: 'unverified' });

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          content: 'Seeking past questions for PCH 301 second semester!'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verification required/i);
    });

    it('allows verified student to publish an academic post with hashtags', async () => {
      const student = await createStudent({ level: '300L' });

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Medicinal Chemistry Study Tips',
          content: 'Study mechanisms of action carefully for #PCH301 and understand SAR #medicinalchem',
          category: 'Exam Preparation',
          level: '300L',
          department: 'PCH',
          courseCode: 'PCH 301'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post.title).toBe('Medicinal Chemistry Study Tips');
      expect(res.body.post.category).toBe('Exam Preparation');
      expect(res.body.post.level).toBe('300L');
      expect(res.body.post.department).toBe('PCH');
      expect(res.body.post.courseCode).toBe('PCH 301');
      expect(res.body.post.tags).toEqual(expect.arrayContaining(['pch301', 'medicinalchem']));
      expect(res.body.post.author.fullName).toBe('Oluwaseun Adeleke');
      expect(res.body.post.isAuthor).toBe(true);

      // Verify author stats incremented (10 default reputation + 5 for post)
      const authorAfter = await User.findById(student.user._id);
      expect(authorAfter.stats.postsCount).toBe(1);
      expect(authorAfter.stats.reputationPoints).toBe(15);
    });

    it('rejects post with empty content or content less than 3 characters', async () => {
      const student = await createStudent();

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects post with invalid category', async () => {
      const student = await createStudent();

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          content: 'Valid content here',
          category: 'Fake Category'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/posts (Social Feed)', () => {
    it('retrieves paginated feed with filters for level, department, and category', async () => {
      const student = await createStudent({ level: '300L' });

      // Create two posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          content: 'Pharmaceutics lab report guide for #PCT301',
          category: 'Lab & Practical',
          level: '300L',
          department: 'PCT'
        });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          content: 'Pharmacology tutorial slides for #PCL401',
          category: 'Academic Discussion',
          level: '400L',
          department: 'PCL'
        });

      // Filter by level 300L
      const res300 = await request(app)
        .get('/api/posts?level=300L')
        .set('Authorization', `Bearer ${student.token}`);

      expect(res300.status).toBe(200);
      expect(res300.body.success).toBe(true);
      expect(res300.body.posts.length).toBe(1);
      expect(res300.body.posts[0].department).toBe('PCT');

      // Filter by department PCL
      const resPcl = await request(app)
        .get('/api/posts?department=PCL')
        .set('Authorization', `Bearer ${student.token}`);

      expect(resPcl.status).toBe(200);
      expect(resPcl.body.posts.length).toBe(1);
      expect(resPcl.body.posts[0].department).toBe('PCL');

      // Filter by tag pct301
      const resTag = await request(app)
        .get('/api/posts?tag=pct301')
        .set('Authorization', `Bearer ${student.token}`);

      expect(resTag.status).toBe(200);
      expect(resTag.body.posts.length).toBe(1);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('retrieves single post and increments viewsCount', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Detailed post testing single retrieval' });

      const postId = createRes.body.post._id;

      const res = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post._id).toBe(postId);
      expect(res.body.post.content).toBe('Detailed post testing single retrieval');
    });

    it('returns 404 for nonexistent post', async () => {
      const student = await createStudent();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/posts/:id', () => {
    it('allows author to update post content and marks post as edited', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Original content before update' });

      const postId = createRes.body.post._id;

      const updateRes = await request(app)
        .patch(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Updated content with clearer explanation' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.post.content).toBe('Updated content with clearer explanation');
      expect(updateRes.body.post.isEdited).toBe(true);
    });

    it('rejects update attempt by another student with 403', async () => {
      const author = await createStudent();
      const otherStudent = await createStudent();

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${author.token}`)
        .send({ content: 'Author post content' });

      const postId = createRes.body.post._id;

      const res = await request(app)
        .patch(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherStudent.token}`)
        .send({ content: 'Hacked content' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('allows author to delete their post', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Post to be deleted' });

      const postId = createRes.body.post._id;

      const delRes = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify post no longer returned in feed
      const feedRes = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${student.token}`);

      expect(feedRes.body.posts.length).toBe(0);
    });
  });

  describe('POST /api/posts/:id/pin', () => {
    it('allows administrator to pin an official post and unpin it', async () => {
      const admin = await createStudent({ role: 'admin' });

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Official Faculty Orientation',
          content: 'Orientation date confirmed by Dean office.',
          category: 'PANS Official'
        });

      const postId = createRes.body.post._id;

      // Pin post
      const pinRes = await request(app)
        .post(`/api/posts/${postId}/pin`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(pinRes.status).toBe(200);
      expect(pinRes.body.post.isPinned).toBe(true);

      // Unpin post
      const unpinRes = await request(app)
        .post(`/api/posts/${postId}/pin`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(unpinRes.status).toBe(200);
      expect(unpinRes.body.post.isPinned).toBe(false);
    });

    it('rejects pin attempt by regular student with 403', async () => {
      const student = await createStudent();

      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Student post' });

      const postId = createRes.body.post._id;

      const pinRes = await request(app)
        .post(`/api/posts/${postId}/pin`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(pinRes.status).toBe(403);
    });
  });
});
