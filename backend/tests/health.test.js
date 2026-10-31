const request = require('supertest');
const app = require('../src/app');

describe('API Foundation and Health Check', () => {
  it('GET / should return welcome message and info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.faculty).toContain('Faculty of Pharmacy');
  });

  it('GET /api/health should return 200 and system health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('appName', 'PharmaLink UNILAG API');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('state');
  });

  it('GET /non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });
});
