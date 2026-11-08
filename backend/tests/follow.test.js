require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Follow = require('../src/models/Follow');
const { USER_ROLES, VERIFICATION_STATUS } = require('@pharmalink/shared');

jest.setTimeout(120000);

let mongoServer;
const testDbUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;

beforeAll(async () => {
  if (testDbUri) {
    try {
      await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 30000 });
    } catch (err) {
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
    }
  } else {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
}, 120000);

afterAll(async () => {
  await User.deleteMany({});
  await Follow.deleteMany({});
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Follow.deleteMany({});
});

describe('EPIC-010: Following and Social Connections API', () => {
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
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        role: overrides.role || USER_ROLES.STUDENT
      });
    } else if (overrides.role) {
      await User.findByIdAndUpdate(userId, {
        role: overrides.role
      });
    }

    const updatedUser = await User.findById(userId);
    return { token, user: updatedUser };
  }

  describe('POST /api/profile/:id/follow', () => {
    it('rejects self-follow attempt with 400 Bad Request', async () => {
      const student = await createStudent();

      const res = await request(app)
        .post(`/api/profile/${student.user._id}/follow`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot follow themselves/i);
    });

    it('rejects unverified student attempt with 403 Forbidden', async () => {
      const unverifiedStudent = await createStudent({
        fullName: 'Unverified Student',
        email: 'unverified@live.unilag.edu.ng',
        matricNumber: '190805901',
        verificationStatus: 'unverified'
      });
      const peer = await createStudent({
        fullName: 'Verified Peer',
        email: 'peer@live.unilag.edu.ng',
        matricNumber: '190805902'
      });

      const res = await request(app)
        .post(`/api/profile/${peer.user._id}/follow`)
        .set('Authorization', `Bearer ${unverifiedStudent.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/restricted to verified/i);
    });

    it('rejects follow when target student is not found with 404', async () => {
      const student = await createStudent();
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/profile/${nonExistentId}/follow`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('rejects follow when student id format is invalid with 400', async () => {
      const student = await createStudent();

      const res = await request(app)
        .post('/api/profile/invalid-format-id/follow')
        .set('Authorization', `Bearer ${student.token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid student id/i);
    });

    it('successfully follows a peer, updates atomic counters, and awards reputation point', async () => {
      const follower = await createStudent({
        fullName: 'Follower Student',
        email: 'follower@live.unilag.edu.ng',
        matricNumber: '190805111'
      });
      const target = await createStudent({
        fullName: 'Target Student',
        email: 'target@live.unilag.edu.ng',
        matricNumber: '190805222'
      });

      const initialFollowerRep = follower.user.stats.reputationPoints || 10;

      const res = await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${follower.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isFollowing).toBe(true);
      expect(res.body.message).toBe('Now following student.');

      // Verify follow record exists in MongoDB
      const followDoc = await Follow.findOne({
        follower: follower.user._id,
        following: target.user._id
      });
      expect(followDoc).not.toBeNull();

      // Verify follower's followingCount incremented and +1 reputation awarded
      const updatedFollower = await User.findById(follower.user._id);
      expect(updatedFollower.stats.followingCount).toBe(1);
      expect(updatedFollower.stats.reputationPoints).toBe(initialFollowerRep + 1);

      // Verify target's followersCount incremented
      const updatedTarget = await User.findById(target.user._id);
      expect(updatedTarget.stats.followersCount).toBe(1);
    });

    it('successfully toggles unfollow, decrements counters atomically', async () => {
      const follower = await createStudent({
        fullName: 'Active Student',
        email: 'active@live.unilag.edu.ng',
        matricNumber: '190805333'
      });
      const target = await createStudent({
        fullName: 'Target Peer',
        email: 'peer2@live.unilag.edu.ng',
        matricNumber: '190805444'
      });

      // Follow first
      await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${follower.token}`);

      // Unfollow (second call)
      const resUnfollow = await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${follower.token}`);

      expect(resUnfollow.statusCode).toBe(200);
      expect(resUnfollow.body.success).toBe(true);
      expect(resUnfollow.body.isFollowing).toBe(false);
      expect(resUnfollow.body.message).toBe('Unfollowed student.');

      // Verify follow record deleted from MongoDB
      const followDoc = await Follow.findOne({
        follower: follower.user._id,
        following: target.user._id
      });
      expect(followDoc).toBeNull();

      // Verify counters decremented back to 0
      const updatedFollower = await User.findById(follower.user._id);
      expect(updatedFollower.stats.followingCount).toBe(0);

      const updatedTarget = await User.findById(target.user._id);
      expect(updatedTarget.stats.followersCount).toBe(0);
    });

    it('allows admin users to follow peers regardless of verificationStatus', async () => {
      const admin = await createStudent({
        fullName: 'System Admin',
        email: 'adminuser@live.unilag.edu.ng',
        matricNumber: '190805555',
        role: USER_ROLES.ADMIN,
        verificationStatus: 'unverified'
      });
      const target = await createStudent({
        fullName: 'Target Peer 3',
        email: 'peer3@live.unilag.edu.ng',
        matricNumber: '190805666'
      });

      const res = await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isFollowing).toBe(true);
    });
  });

  describe('GET /api/profile/:id/follow-status', () => {
    it('returns isFollowing true when actively following and false otherwise', async () => {
      const studentA = await createStudent({
        fullName: 'Student A',
        email: 'studenta@live.unilag.edu.ng',
        matricNumber: '190805777'
      });
      const studentB = await createStudent({
        fullName: 'Student B',
        email: 'studentb@live.unilag.edu.ng',
        matricNumber: '190805888'
      });

      // Before follow
      const resBefore = await request(app)
        .get(`/api/profile/${studentB.user._id}/follow-status`)
        .set('Authorization', `Bearer ${studentA.token}`);

      expect(resBefore.statusCode).toBe(200);
      expect(resBefore.body.success).toBe(true);
      expect(resBefore.body.isFollowing).toBe(false);

      // Follow
      await request(app)
        .post(`/api/profile/${studentB.user._id}/follow`)
        .set('Authorization', `Bearer ${studentA.token}`);

      // After follow
      const resAfter = await request(app)
        .get(`/api/profile/${studentB.user._id}/follow-status`)
        .set('Authorization', `Bearer ${studentA.token}`);

      expect(resAfter.statusCode).toBe(200);
      expect(resAfter.body.success).toBe(true);
      expect(resAfter.body.isFollowing).toBe(true);

      // Check reverse (Student B is not following Student A)
      const resReverse = await request(app)
        .get(`/api/profile/${studentA.user._id}/follow-status`)
        .set('Authorization', `Bearer ${studentB.token}`);

      expect(resReverse.statusCode).toBe(200);
      expect(resReverse.body.isFollowing).toBe(false);
    });
  });

  describe('GET /api/profile/:id/followers and GET /api/profile/:id/following', () => {
    it('lists followers populated with safe user attributes (no password)', async () => {
      const studentA = await createStudent({
        fullName: 'Follower One',
        email: 'follower1@live.unilag.edu.ng',
        matricNumber: '190805121',
        level: '300L'
      });
      const studentB = await createStudent({
        fullName: 'Follower Two',
        email: 'follower2@live.unilag.edu.ng',
        matricNumber: '190805122',
        level: '400L'
      });
      const target = await createStudent({
        fullName: 'Target Star',
        email: 'targetstar@live.unilag.edu.ng',
        matricNumber: '190805123',
        level: '500L'
      });

      // Both studentA and studentB follow target
      await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${studentA.token}`);

      await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${studentB.token}`);

      const res = await request(app)
        .get(`/api/profile/${target.user._id}/followers`)
        .set('Authorization', `Bearer ${target.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.followers).toHaveLength(2);

      const names = res.body.followers.map((f) => f.fullName);
      expect(names).toContain('Follower One');
      expect(names).toContain('Follower Two');

      // Verify safe attributes and absence of password
      res.body.followers.forEach((f) => {
        expect(f.matricNumber).toBeDefined();
        expect(f.level).toBeDefined();
        expect(f.stats).toBeDefined();
        expect(f.password).toBeUndefined();
      });
    });

    it('lists users followed by a student', async () => {
      const studentA = await createStudent({
        fullName: 'Social Explorer',
        email: 'explorer@live.unilag.edu.ng',
        matricNumber: '190805131'
      });
      const targetOne = await createStudent({
        fullName: 'Peer Alpha',
        email: 'alpha@live.unilag.edu.ng',
        matricNumber: '190805132'
      });
      const targetTwo = await createStudent({
        fullName: 'Peer Beta',
        email: 'beta@live.unilag.edu.ng',
        matricNumber: '190805133'
      });

      // studentA follows targetOne and targetTwo
      await request(app)
        .post(`/api/profile/${targetOne.user._id}/follow`)
        .set('Authorization', `Bearer ${studentA.token}`);

      await request(app)
        .post(`/api/profile/${targetTwo.user._id}/follow`)
        .set('Authorization', `Bearer ${studentA.token}`);

      const res = await request(app)
        .get(`/api/profile/${studentA.user._id}/following`)
        .set('Authorization', `Bearer ${studentA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.following).toHaveLength(2);

      const names = res.body.following.map((f) => f.fullName);
      expect(names).toContain('Peer Alpha');
      expect(names).toContain('Peer Beta');

      res.body.following.forEach((f) => {
        expect(f.password).toBeUndefined();
        expect(f.stats).toBeDefined();
      });
    });
  });

  describe('Directory and Profile isFollowing decoration', () => {
    it('decorates student directory with isFollowing boolean relative to active user', async () => {
      const viewer = await createStudent({
        fullName: 'Directory Viewer',
        email: 'viewer@live.unilag.edu.ng',
        matricNumber: '190805141',
        level: '200L'
      });
      const peerFollowed = await createStudent({
        fullName: 'Followed Peer',
        email: 'followed@live.unilag.edu.ng',
        matricNumber: '190805142',
        level: '200L'
      });
      const peerNotFollowed = await createStudent({
        fullName: 'Unfollowed Peer',
        email: 'unfollowed@live.unilag.edu.ng',
        matricNumber: '190805143',
        level: '200L'
      });

      // viewer follows peerFollowed
      await request(app)
        .post(`/api/profile/${peerFollowed.user._id}/follow`)
        .set('Authorization', `Bearer ${viewer.token}`);

      const res = await request(app)
        .get('/api/profile/directory/students?level=200L')
        .set('Authorization', `Bearer ${viewer.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const followedEntry = res.body.students.find((s) => s.fullName === 'Followed Peer');
      const unfollowedEntry = res.body.students.find((s) => s.fullName === 'Unfollowed Peer');
      const selfEntry = res.body.students.find((s) => s.fullName === 'Directory Viewer');

      expect(followedEntry).toBeDefined();
      expect(followedEntry.isFollowing).toBe(true);

      expect(unfollowedEntry).toBeDefined();
      expect(unfollowedEntry.isFollowing).toBe(false);

      expect(selfEntry).toBeDefined();
      expect(selfEntry.isFollowing).toBe(false);
    });

    it('decorates public profile GET /api/profile/:id with isFollowing boolean', async () => {
      const viewer = await createStudent({
        fullName: 'Profile Viewer',
        email: 'profileviewer@live.unilag.edu.ng',
        matricNumber: '190805151'
      });
      const target = await createStudent({
        fullName: 'Profile Target',
        email: 'profiletarget@live.unilag.edu.ng',
        matricNumber: '190805152'
      });

      // Before follow
      const resBefore = await request(app)
        .get(`/api/profile/${target.user._id}`)
        .set('Authorization', `Bearer ${viewer.token}`);

      expect(resBefore.statusCode).toBe(200);
      expect(resBefore.body.profile.isFollowing).toBe(false);
      expect(resBefore.body.profile.stats.followersCount).toBe(0);

      // Follow target
      await request(app)
        .post(`/api/profile/${target.user._id}/follow`)
        .set('Authorization', `Bearer ${viewer.token}`);

      // After follow
      const resAfter = await request(app)
        .get(`/api/profile/${target.user._id}`)
        .set('Authorization', `Bearer ${viewer.token}`);

      expect(resAfter.statusCode).toBe(200);
      expect(resAfter.body.profile.isFollowing).toBe(true);
      expect(resAfter.body.profile.stats.followersCount).toBe(1);
    });
  });

  describe('Model-level constraints', () => {
    it('prevents creating duplicate follow in database via compound index', async () => {
      const studentA = await createStudent({ matricNumber: '190805161', email: 'dup1@live.unilag.edu.ng' });
      const studentB = await createStudent({ matricNumber: '190805162', email: 'dup2@live.unilag.edu.ng' });

      await Follow.create({
        follower: studentA.user._id,
        following: studentB.user._id
      });

      // Attempt second insertion
      let duplicateError = null;
      try {
        await Follow.create({
          follower: studentA.user._id,
          following: studentB.user._id
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError.code).toBe(11000);
    });

    it('prevents follower from being identical to following in model validator', async () => {
      const studentA = await createStudent({ matricNumber: '190805171', email: 'self1@live.unilag.edu.ng' });

      let selfFollowError = null;
      try {
        await Follow.create({
          follower: studentA.user._id,
          following: studentA.user._id
        });
      } catch (err) {
        selfFollowError = err;
      }

      expect(selfFollowError).not.toBeNull();
      expect(selfFollowError.message).toMatch(/cannot follow themselves/i);
    });
  });
});
