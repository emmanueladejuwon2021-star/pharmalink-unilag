const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const AcademicCourse = require('../src/models/AcademicCourse');
const { VERIFICATION_STATUS, USER_ROLES } = require('@pharmalink/shared');

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
  await Post.deleteMany({});
  await AcademicCourse.deleteMany({});
  await User.deleteMany({});
});

async function registerStudent(payload) {
  const res = await request(app).post('/api/auth/register').send(payload);
  expect(res.statusCode).toBe(201);
  return { token: res.body.token, user: res.body.user };
}

async function markVerified(userId, role) {
  const update = { verificationStatus: VERIFICATION_STATUS.VERIFIED };
  if (role) update.role = role;
  await User.findByIdAndUpdate(userId, update);
}

const ada = {
  fullName: 'Ada Uche',
  email: 'auche@live.unilag.edu.ng',
  matricNumber: '200805101',
  level: '300L',
  password: 'Password123!'
};
const bob = {
  fullName: 'Bob Adeyemi',
  email: 'badeyemi@live.unilag.edu.ng',
  matricNumber: '210805102',
  level: '200L',
  password: 'Password123!'
};
const senior = {
  fullName: 'Zainab Mohammed',
  email: 'zmohammed@live.unilag.edu.ng',
  matricNumber: '190805103',
  level: '400L',
  password: 'Password123!'
};

describe('EPIC-006/007: Social Feed and Post Management API', () => {
  describe('Private community boundary', () => {
    it('rejects unauthenticated feed access with 401', async () => {
      const res = await request(app).get('/api/feed');
      expect(res.statusCode).toBe(401);
    });

    it('rejects unverified students with 403', async () => {
      const { token } = await registerStudent(ada);
      const res = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(403);
    });

    it('serves an empty feed to verified students', async () => {
      const { token, user } = await registerStudent(ada);
      await markVerified(user._id);
      const res = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.posts).toEqual([]);
    });
  });

  describe('POST /api/feed — post creation', () => {
    it('creates a discussion post for verified students', async () => {
      const { token, user } = await registerStudent(ada);
      await markVerified(user._id);

      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Study group for PHA301?',
          body: 'Anyone forming a revision group for pharmacognosy exams?',
          type: 'discussion'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.post.title).toBe('Study group for PHA301?');
      expect(res.body.post.type).toBe('discussion');
      expect(res.body.post.authorLevel).toBe('300L');
      expect(res.body.post.viewerCanManage).toBe(true);
    });

    it('rejects posts from unverified students', async () => {
      const { token } = await registerStudent(bob);
      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hello everyone', body: 'First post here.' });
      expect(res.statusCode).toBe(403);
    });

    it('validates title and body lengths on the server', async () => {
      const { token, user } = await registerStudent(ada);
      await markVerified(user._id);

      const shortTitle = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'abc', body: 'Long enough body text.' });
      expect(shortTitle.statusCode).toBe(400);

      const emptyBody = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Valid title here', body: '   ' });
      expect(emptyBody.statusCode).toBe(400);
    });

    it('blocks students from publishing official announcements', async () => {
      const { token, user } = await registerStudent(ada);
      await markVerified(user._id);

      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'PANS executive meeting notice',
          body: 'All hands required at the faculty hall.',
          type: 'announcement'
        });
      expect(res.statusCode).toBe(403);
    });

    it('allows PANS executives to publish announcements', async () => {
      const { token, user } = await registerStudent(senior);
      await markVerified(user._id, USER_ROLES.PANS_EXEC);

      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Annual Dinner ticket sales open',
          body: 'Tickets available at the PANS secretariat from Monday.',
          type: 'announcement'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.post.type).toBe('announcement');
    });

    it('rejects course tags not present in the catalogue', async () => {
      const { token, user } = await registerStudent(ada);
      await markVerified(user._id);

      const bad = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Notes for mystery course', body: 'Any materials around?', courseCode: 'ZZZ999' });
      expect(bad.statusCode).toBe(400);

      await AcademicCourse.create({ code: 'PHA301', title: 'Pharmacognosy III', level: '300L' });
      const good = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Notes for PHA301', body: 'Any materials around?', courseCode: 'pha301' });
      expect(good.statusCode).toBe(201);
      expect(good.body.post.courseCode).toBe('PHA301');
    });
  });

  describe('Feed visibility rules', () => {
    async function setupStudents() {
      const junior = await registerStudent(bob);
      await markVerified(junior.user._id);
      const mid = await registerStudent(ada);
      await markVerified(mid.user._id);
      return { junior, mid };
    }

    it('hides level-only posts from junior students but shows them to seniors', async () => {
      const { junior, mid } = await setupStudents();

      const created = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${mid.token}`)
        .send({
          title: 'PHA301 exam trick question',
          body: 'How did everyone handle the last dosage calculation?',
          visibility: 'level-only'
        });
      expect(created.statusCode).toBe(201);
      expect(created.body.post.targetLevel).toBe('300L');

      const juniorFeed = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${junior.token}`);
      expect(juniorFeed.body.count).toBe(0);

      const seniorView = await request(app)
        .get(`/api/feed/${created.body.post._id}`)
        .set('Authorization', `Bearer ${junior.token}`);
      expect(seniorView.statusCode).toBe(403);

      const ownFeed = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${mid.token}`);
      expect(ownFeed.body.count).toBe(1);
    });

    it('clamps student-chosen target levels to their own level', async () => {
      const { mid } = await setupStudents();
      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${mid.token}`)
        .send({
          title: 'Trying to reach 500L only',
          body: 'This should be forced back to 300L.',
          visibility: 'level-only',
          targetLevel: '500L'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.post.targetLevel).toBe('300L');
    });
  });

  describe('Filtering and search', () => {
    let author;
    beforeEach(async () => {
      author = await registerStudent(ada);
      await markVerified(author.user._id);
      await Post.create([
        {
          author: author.user._id, authorName: 'Ada Uche', authorLevel: '300L', authorRole: 'student',
          title: 'Lab coat requirements', body: 'What colour lab coats are mandatory?', type: 'discussion'
        },
        {
          author: author.user._id, authorName: 'Ada Uche', authorLevel: '300L', authorRole: 'student',
          title: 'PHC202 past questions', body: 'Where can I find PYC past questions?', type: 'question'
        },
        {
          author: author.user._id, authorName: 'Ada Uche', authorLevel: '300L', authorRole: 'pans_exec',
          title: 'Freshers welcome week', body: 'Official PANS schedule released.', type: 'announcement', isPinned: true
        }
      ]);
    });

    it('filters by tab', async () => {
      const questions = await request(app)
        .get('/api/feed?tab=questions')
        .set('Authorization', `Bearer ${author.token}`);
      expect(questions.body.count).toBe(1);
      expect(questions.body.posts[0].title).toBe('PHC202 past questions');

      const ann = await request(app)
        .get('/api/feed?tab=announcements')
        .set('Authorization', `Bearer ${author.token}`);
      expect(ann.body.count).toBe(1);
    });

    it('orders pinned announcements first, then newest', async () => {
      const res = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${author.token}`);
      expect(res.body.posts[0].type).toBe('announcement');
    });

    it('searches titles and bodies safely', async () => {
      const res = await request(app)
        .get('/api/feed?search=lab+coat')
        .set('Authorization', `Bearer ${author.token}`);
      expect(res.body.count).toBe(1);

      const injection = await request(app)
        .get('/api/feed?search=' + encodeURIComponent('*.+?['))
        .set('Authorization', `Bearer ${author.token}`);
      expect(injection.statusCode).toBe(200);
      expect(injection.body.count).toBe(0);
    });

    it('rejects unknown tabs and levels', async () => {
      const badTab = await request(app)
        .get('/api/feed?tab=gossip')
        .set('Authorization', `Bearer ${author.token}`);
      expect(badTab.statusCode).toBe(400);

      const badLevel = await request(app)
        .get('/api/feed?tab=level&level=600L')
        .set('Authorization', `Bearer ${author.token}`);
      expect(badLevel.statusCode).toBe(400);
    });
  });

  describe('Post management (edit, delete, pin)', () => {
    let author;
    let other;
    beforeEach(async () => {
      author = await registerStudent(ada);
      await markVerified(author.user._id);
      other = await registerStudent(bob);
      await markVerified(other.user._id);
    });

    async function createAuthoredPost(token) {
      const res = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Editable discussion', body: 'Original content here.' });
      expect(res.statusCode).toBe(201);
      return res.body.post;
    }

    it('lets authors edit their own posts', async () => {
      const post = await createAuthoredPost(author.token);
      const res = await request(app)
        .patch(`/api/feed/${post._id}`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ body: 'Updated content after clarification.' });
      expect(res.statusCode).toBe(200);
      expect(res.body.post.body).toBe('Updated content after clarification.');
    });

    it('prevents editing someone else post', async () => {
      const post = await createAuthoredPost(author.token);
      const res = await request(app)
        .patch(`/api/feed/${post._id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ body: 'Hijacked content value.' });
      expect(res.statusCode).toBe(403);
    });

    it('soft-deletes own posts and hides them from the feed', async () => {
      const post = await createAuthoredPost(author.token);
      const del = await request(app)
        .delete(`/api/feed/${post._id}`)
        .set('Authorization', `Bearer ${author.token}`);
      expect(del.statusCode).toBe(200);

      const feed = await request(app)
        .get('/api/feed')
        .set('Authorization', `Bearer ${other.token}`);
      expect(feed.body.count).toBe(0);

      const gone = await Post.findById(post._id);
      expect(gone.isDeleted).toBe(true);
    });

    it('lets moderators remove any post as moderation', async () => {
      const post = await createAuthoredPost(author.token);
      const mod = await registerStudent({
        fullName: 'Mod Admin',
        email: 'mod@live.unilag.edu.ng',
        matricNumber: '180805999',
        level: '500L',
        password: 'Password123!'
      });
      await markVerified(mod.user._id, USER_ROLES.MODERATOR);

      const res = await request(app)
        .delete(`/api/feed/${post._id}`)
        .set('Authorization', `Bearer ${mod.token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/moderation/i);
    });

    it('blocks regular students from deleting others posts', async () => {
      const post = await createAuthoredPost(author.token);
      const res = await request(app)
        .delete(`/api/feed/${post._id}`)
        .set('Authorization', `Bearer ${other.token}`);
      expect(res.statusCode).toBe(403);
    });

    it('pins announcements for staff only, and rejects pinning discussions', async () => {
      const discussion = await createAuthoredPost(author.token);

      const forbidden = await request(app)
        .post(`/api/feed/${discussion._id}/pin`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ pinned: true });
      expect(forbidden.statusCode).toBe(403);

      const exec = await registerStudent(senior);
      await markVerified(exec.user._id, USER_ROLES.PANS_EXEC);
      const wrongType = await request(app)
        .post(`/api/feed/${discussion._id}/pin`)
        .set('Authorization', `Bearer ${exec.token}`)
        .send({ pinned: true });
      expect(wrongType.statusCode).toBe(400);

      const announcement = await request(app)
        .post('/api/feed')
        .set('Authorization', `Bearer ${exec.token}`)
        .send({ title: 'Important PANS notice', body: 'Read carefully everyone.', type: 'announcement' });
      const pinned = await request(app)
        .post(`/api/feed/${announcement.body.post._id}/pin`)
        .set('Authorization', `Bearer ${exec.token}`)
        .send({ pinned: true });
      expect(pinned.statusCode).toBe(200);
      expect(pinned.body.post.isPinned).toBe(true);
    });
  });
});
