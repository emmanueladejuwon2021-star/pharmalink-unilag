require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');

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
  await Comment.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
});

describe('EPIC-008: Comments and Discussions API', () => {
  async function createStudent(overrides = {}) {
    const matricNum = overrides.matricNumber || '190805' + Math.floor(100 + Math.random() * 900);
    const emailAddr = overrides.email || `student${Math.floor(100 + Math.random() * 900)}@live.unilag.edu.ng`;

    const defaultData = {
      fullName: 'Tolulope Awolowo',
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

  async function createTestPost(authorToken) {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Pharmaceutics Calculations Discussion',
        content: 'How do you calculate isotonicity equivalents for eye drops?',
        category: 'Academic Discussion',
        level: '300L',
        department: 'PCT'
      });
    return res.body.post;
  }

  describe('POST /api/posts/:postId/comments', () => {
    it('rejects commenting if student is unverified', async () => {
      const verifiedStudent = await createStudent({ level: '300L' });
      const post = await createTestPost(verifiedStudent.token);

      const unverifiedStudent = await createStudent({ verificationStatus: 'unverified' });

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${unverifiedStudent.token}`)
        .send({ content: 'Use the sodium chloride equivalent method.' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verification required/i);
    });

    it('allows verified student to post a comment and increments post repliesCount', async () => {
      const author = await createStudent({ level: '300L' });
      const post = await createTestPost(author.token);

      const commenter = await createStudent({ level: '400L' });

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ content: 'Use the White-Vincent or Sprowls method for tonicity adjustment.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.content).toContain('White-Vincent');
      expect(res.body.comment.isAuthor).toBe(true);
      expect(res.body.comment.author.fullName).toBe('Tolulope Awolowo');

      // Verify post replies count incremented
      const postAfter = await Post.findById(post._id);
      expect(postAfter.repliesCount).toBe(1);

      // Verify commenter reputation increased (+2 pts)
      const commenterAfter = await User.findById(commenter.user._id);
      expect(commenterAfter.stats.reputationPoints).toBe(12); // 10 base + 2
    });

    it('rejects empty comment content', async () => {
      const author = await createStudent({ level: '300L' });
      const post = await createTestPost(author.token);

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for non-existent post', async () => {
      const student = await createStudent();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Nice discussion' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    it('returns chronological list of comments for a post', async () => {
      const author = await createStudent();
      const post = await createTestPost(author.token);

      const commenter1 = await createStudent();
      const commenter2 = await createStudent();

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenter1.token}`)
        .send({ content: 'First reply' });

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenter2.token}`)
        .send({ content: 'Second reply' });

      const res = await request(app)
        .get(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${author.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments.length).toBe(2);
      expect(res.body.comments[0].content).toBe('First reply');
      expect(res.body.comments[1].content).toBe('Second reply');
    });
  });

  describe('PATCH /api/posts/:postId/comments/:commentId', () => {
    it('allows comment author to edit their comment', async () => {
      const student = await createStudent();
      const post = await createTestPost(student.token);

      const createRes = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Typo in comment' });

      const commentId = createRes.body.comment._id;

      const editRes = await request(app)
        .patch(`/api/posts/${post._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Corrected formula explanation' });

      expect(editRes.status).toBe(200);
      expect(editRes.body.success).toBe(true);
      expect(editRes.body.comment.content).toBe('Corrected formula explanation');
      expect(editRes.body.comment.isEdited).toBe(true);
    });

    it('rejects editing comment by another student with 403', async () => {
      const author = await createStudent();
      const post = await createTestPost(author.token);

      const createRes = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ content: 'Author comment' });

      const commentId = createRes.body.comment._id;
      const otherStudent = await createStudent();

      const res = await request(app)
        .patch(`/api/posts/${post._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherStudent.token}`)
        .send({ content: 'Malicious edit' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/posts/:postId/comments/:commentId', () => {
    it('allows author to soft-delete comment and decrements repliesCount', async () => {
      const student = await createStudent();
      const post = await createTestPost(student.token);

      const createRes = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ content: 'Comment to delete' });

      const commentId = createRes.body.comment._id;

      const delRes = await request(app)
        .delete(`/api/posts/${post._id}/comments/${commentId}`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify post replies count decremented back to 0
      const postAfter = await Post.findById(post._id);
      expect(postAfter.repliesCount).toBe(0);
    });
  });
});
