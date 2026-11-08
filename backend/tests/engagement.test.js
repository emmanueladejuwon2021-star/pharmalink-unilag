require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const Like = require('../src/models/Like');
const ReLink = require('../src/models/ReLink');
const Bookmark = require('../src/models/Bookmark');

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
  await Like.deleteMany({});
  await ReLink.deleteMany({});
  await Bookmark.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await Like.deleteMany({});
  await ReLink.deleteMany({});
  await Bookmark.deleteMany({});
});

describe('EPIC-009: Likes, Re-Links and Bookmarks API', () => {
  async function createStudent(overrides = {}) {
    const matricNum = overrides.matricNumber || '190805' + Math.floor(100 + Math.random() * 900);
    const emailAddr = overrides.email || `student${Math.floor(100 + Math.random() * 900)}@live.unilag.edu.ng`;

    const defaultData = {
      fullName: 'Oluwaseyi Martins',
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
        title: 'Pharmacology Drug Mechanism Notes',
        content: 'Overview of beta-lactam antibiotic mechanisms against gram-positive cell walls.',
        category: 'Exam Preparation',
        level: '300L',
        department: 'PCL'
      });
    return res.body.post;
  }

  describe('POST /api/posts/:id/like', () => {
    it('rejects liking a post if student is unverified', async () => {
      const verifiedAuthor = await createStudent({ level: '300L' });
      const post = await createTestPost(verifiedAuthor.token);

      const unverifiedStudent = await createStudent({ verificationStatus: 'unverified' });

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${unverifiedStudent.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/verification required/i);
    });

    it('toggles like and increments/decrements likesCount and author reputation', async () => {
      const author = await createStudent({ level: '300L' });
      const post = await createTestPost(author.token);

      const liker = await createStudent({ level: '400L' });

      // First call: Like
      const likeRes = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.success).toBe(true);
      expect(likeRes.body.liked).toBe(true);
      expect(likeRes.body.likesCount).toBe(1);

      // Verify author reputation increased (+1 point)
      // Author had 10 (base) + 5 (post) = 15; now 16
      const authorAfterLike = await User.findById(author.user._id);
      expect(authorAfterLike.stats.reputationPoints).toBe(16);

      // Second call: Unlike
      const unlikeRes = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.success).toBe(true);
      expect(unlikeRes.body.liked).toBe(false);
      expect(unlikeRes.body.likesCount).toBe(0);

      // Verify author reputation decremented back
      const authorAfterUnlike = await User.findById(author.user._id);
      expect(authorAfterUnlike.stats.reputationPoints).toBe(15);
    });
  });

  describe('POST /api/posts/:postId/comments/:commentId/like', () => {
    it('toggles like on a comment and updates comment likesCount', async () => {
      const author = await createStudent();
      const post = await createTestPost(author.token);

      const commenter = await createStudent();
      const commentRes = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ content: 'Penicillin-binding proteins are the primary targets.' });

      const commentId = commentRes.body.comment._id;
      const liker = await createStudent();

      // Like comment
      const likeRes = await request(app)
        .post(`/api/posts/${post._id}/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.success).toBe(true);
      expect(likeRes.body.liked).toBe(true);
      expect(likeRes.body.likesCount).toBe(1);

      // Unlike comment
      const unlikeRes = await request(app)
        .post(`/api/posts/${post._id}/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${liker.token}`);

      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.liked).toBe(false);
      expect(unlikeRes.body.likesCount).toBe(0);
    });
  });

  describe('POST /api/posts/:id/relink', () => {
    it('toggles re-link and updates post reLinksCount', async () => {
      const author = await createStudent();
      const post = await createTestPost(author.token);

      const sharer = await createStudent();

      // Re-link
      const relinkRes = await request(app)
        .post(`/api/posts/${post._id}/relink`)
        .set('Authorization', `Bearer ${sharer.token}`);

      expect(relinkRes.status).toBe(200);
      expect(relinkRes.body.success).toBe(true);
      expect(relinkRes.body.relinked).toBe(true);
      expect(relinkRes.body.reLinksCount).toBe(1);

      // Undo re-link
      const undoRes = await request(app)
        .post(`/api/posts/${post._id}/relink`)
        .set('Authorization', `Bearer ${sharer.token}`);

      expect(undoRes.status).toBe(200);
      expect(undoRes.body.relinked).toBe(false);
      expect(undoRes.body.reLinksCount).toBe(0);
    });
  });

  describe('POST /api/posts/:id/bookmark & GET /api/bookmarks', () => {
    it('saves a post to student bookmarks and retrieves user bookmarks list', async () => {
      const author = await createStudent();
      const post = await createTestPost(author.token);

      const student = await createStudent();

      // Bookmark post
      const bmRes = await request(app)
        .post(`/api/posts/${post._id}/bookmark`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(bmRes.status).toBe(200);
      expect(bmRes.body.success).toBe(true);
      expect(bmRes.body.bookmarked).toBe(true);

      // Fetch saved bookmarks
      const listRes = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${student.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.count).toBe(1);
      expect(listRes.body.bookmarks[0].post.title).toBe('Pharmacology Drug Mechanism Notes');

      // Unbookmark
      const unBmRes = await request(app)
        .post(`/api/posts/${post._id}/bookmark`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(unBmRes.status).toBe(200);
      expect(unBmRes.body.bookmarked).toBe(false);

      // List again (empty)
      const listEmpty = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${student.token}`);

      expect(listEmpty.body.count).toBe(0);
    });
  });
});
